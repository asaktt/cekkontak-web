import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { consumeSearchToken } from "@/lib/orderStore";

// ── Config (mirrors gtc.py constants) ──────────────────────────────────────
const GTC_BASE = "https://pbssrv-centralevents.com";
const HMAC_KEY = "31426764382a642f3a6665497235466f3d236d5d785b722b4c657457442a495b494524324866782a2364292478587a78662d7a7b7578593f71703e2b7e365762";
const APP_VERSION = "8.4.0";
const ANDROID_OS = "android 9";
const LANG = "en_US";
const COUNTRY = "id";
const DEVICE_NAME = "SM-G977N";
const BUNDLE_ID = "app.source.getcontact";

// ── Crypto helpers ──────────────────────────────────────────────────────────
function sig(ts: string, message: string, keyHex: string): string {
  const mac = crypto.createHmac("sha256", Buffer.from(keyHex, "hex"));
  mac.update(`${ts}-${message}`);
  return mac.digest("base64");
}

function pad(b: Buffer): Buffer {
  const n = 16 - (b.length % 16);
  const padding = Buffer.alloc(n, n);
  return Buffer.concat([b, padding]);
}

function encrypt(data: string, keyHex: string): string {
  const cipher = crypto.createCipheriv("aes-256-ecb", Buffer.from(keyHex, "hex"), null);
  cipher.setAutoPadding(false);
  const padded = pad(Buffer.from(data, "utf-8"));
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString("base64");
}

function decrypt(data: string, keyHex: string): string {
  const decipher = crypto.createDecipheriv("aes-256-ecb", Buffer.from(keyHex, "hex"), null);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  const padLen = decrypted[decrypted.length - 1];
  return decrypted.slice(0, decrypted.length - padLen).toString("utf-8");
}

function ts(): string {
  return String(Date.now());
}

// ── GetContact API call ────────────────────────────────────────────────────
async function gtcCall(
  endpoint: string,
  payload: Record<string, unknown>,
  token: string,
  finalKey: string,
  deviceId: string
): Promise<{ code: number; body: Record<string, unknown> }> {
  const raw = JSON.stringify(payload);
  const timestamp = ts();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-os": ANDROID_OS,
    "x-app-version": APP_VERSION,
    "x-client-device-id": deviceId,
    "x-lang": LANG,
    "x-req-timestamp": timestamp,
    "x-country-code": COUNTRY,
    "x-encrypted": "1",
    "x-req-signature": sig(timestamp, raw, HMAC_KEY),
  };
  if (token) headers["x-token"] = token;

  const body = JSON.stringify({ data: encrypt(raw, finalKey) });

  const r = await fetch(GTC_BASE + endpoint, {
    method: "POST",
    headers,
    body,
  });

  const parsed = await r.json();
  const decrypted =
    parsed.data ? JSON.parse(decrypt(parsed.data as string, finalKey)) : parsed;

  return { code: r.status, body: decrypted };
}

// ── Normalize phone ────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const p = raw.trim().replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return "+62" + p.slice(1);
  if (p.startsWith("62")) return "+" + p;
  throw new Error(`Nomor tidak valid: ${raw}`);
}

function dig(obj: unknown, path: string, def: unknown = null): unknown {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (typeof cur !== "object" || cur === null || !(k in (cur as Record<string, unknown>))) return def;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

// ── Promo token store (inline, shared with promo/use route via module cache) ─
// NOTE: We re-implement a simple version here since Next.js module isolation
// makes cross-route module sharing tricky. The promo/use route issues the token
// and stores it; we validate against the same in-memory Map via shared module.

// ── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { phone: rawPhone, searchToken } = await req.json();

  if (!rawPhone) {
    return NextResponse.json({ error: "Nomor HP diperlukan" }, { status: 400 });
  }

  if (!searchToken) {
    return NextResponse.json(
      { error: "Token pembayaran diperlukan. Silakan bayar atau gunakan kode promo." },
      { status: 402 }
    );
  }

  // Validate token — try payment token first, then promo token
  // Payment token: from orderStore
  const paymentResult = consumeSearchToken(searchToken);

  // Promo token: dynamic import to share module instance
  let promoPhoneResult: { phone: string } | null = null;
  if (!paymentResult) {
    // Import promo token consumer from the promo/use module
    try {
      const { consumePromoToken } = await import("@/app/api/promo/use/route");
      promoPhoneResult = consumePromoToken(searchToken);
    } catch {
      // ignore
    }
  }

  const resolvedPhone = paymentResult?.phone ?? promoPhoneResult?.phone ?? null;

  if (!resolvedPhone) {
    return NextResponse.json(
      { error: "Token tidak valid atau sudah digunakan" },
      { status: 403 }
    );
  }

  // Credentials from Vercel env vars
  const token = process.env.GTC_TOKEN;
  const finalKey = process.env.GTC_FINAL_KEY;
  const deviceId = process.env.GTC_DEVICE_ID;

  if (!token || !finalKey || !deviceId) {
    return NextResponse.json(
      { error: "Credential belum dikonfigurasi di server" },
      { status: 500 }
    );
  }

  let phone: string;
  try {
    phone = normalizePhone(rawPhone);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Verify the phone in the token matches requested phone
  let resolvedNorm: string;
  try {
    resolvedNorm = normalizePhone(resolvedPhone);
  } catch {
    resolvedNorm = resolvedPhone;
  }

  if (resolvedNorm !== phone) {
    return NextResponse.json(
      { error: "Token tidak sesuai dengan nomor yang diminta" },
      { status: 403 }
    );
  }

  try {
    // Fetch profile (search endpoint)
    const profilePayload = {
      countryCode: COUNTRY,
      phoneNumber: phone,
      source: "search",
      token,
    };
    const { code: pCode, body: pBody } = await gtcCall(
      "/v2.8/search",
      profilePayload,
      token,
      finalKey,
      deviceId
    );

    // Fetch tags (number-detail endpoint)
    const tagsPayload = {
      countryCode: COUNTRY,
      phoneNumber: phone,
      source: "profile",
      token,
    };
    const { code: tCode, body: tBody } = await gtcCall(
      "/v2.8/number-detail",
      tagsPayload,
      token,
      finalKey,
      deviceId
    );

    const profileMeta = dig(pBody, "meta.httpStatusCode") as number;
    const tagsMeta = dig(tBody, "meta.httpStatusCode") as number;

    if (pCode !== 200 || profileMeta !== 200) {
      const errMsg = dig(pBody, "meta.errorMessage", "Unknown error") as string;
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const profile = dig(pBody, "result.profile") as Record<string, unknown> | null;
    const tags = (dig(tBody, "result.tags") ?? []) as Array<Record<string, unknown>>;

    return NextResponse.json({
      phone,
      profile: profile
        ? {
            displayName: profile.displayName ?? null,
            name: profile.name ?? null,
            surname: profile.surname ?? null,
            phoneNumber: profile.phoneNumber ?? phone,
            displayNumber: profile.displayNumber ?? null,
            tagCount: profile.tagCount ?? tags.length,
            email: profile.email ?? null,
          }
        : null,
      tags: tags.map((t) => ({ tag: t.tag, count: t.count ?? 0 })),
      tagsFetched: tCode === 200 && tagsMeta === 200,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
