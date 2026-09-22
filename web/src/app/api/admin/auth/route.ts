import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-secret-change-me-in-production"
);
const COOKIE_NAME = "admin_token";
const TOKEN_TTL = "8h";

// ── Rate Limiter (in-memory, per IP) ─────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit
const LOCKOUT_MS = 15 * 60 * 1000; // lockout 15 menit

interface AttemptRecord { count: number; firstAt: number; lockedUntil: number; }
const attempts = new Map<string, AttemptRecord>();

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const rec = attempts.get(ip);

  if (rec) {
    // Masih dalam lockout?
    if (rec.lockedUntil > now) {
      return { allowed: false, retryAfterMs: rec.lockedUntil - now };
    }
    // Window sudah expired → reset
    if (now - rec.firstAt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
  return { allowed: true };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);

  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }

  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(ip, rec);
}

function clearRecord(ip: string): void {
  attempts.delete(ip);
}

// ── POST — Login ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const minutes = Math.ceil((retryAfterMs ?? 0) / 60000);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  if (!password || password !== adminPassword) {
    recordFailure(ip);
    // Constant-time delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    return NextResponse.json({ error: "Autentikasi gagal" }, { status: 401 });
  }

  // Login berhasil — reset rate limit
  clearRecord(ip);

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60,
    path: "/",  // must be "/" so cookie is sent to /api/admin/* routes too
  });
  return res;
}

// ── DELETE — Logout ───────────────────────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}

// ── Helper: verify admin JWT ──────────────────────────────────────────────────
export async function verifyAdminToken(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
