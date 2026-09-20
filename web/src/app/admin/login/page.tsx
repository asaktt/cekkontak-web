"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin");
      } else {
        setError(data.error ?? "Login gagal");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      position: "relative",
      overflow: "hidden",
      background: "var(--bg)",
    }}>
      {/* Background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 65%)",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 380,
        background: "linear-gradient(145deg, rgba(10,14,30,0.97), rgba(6,10,22,0.97))",
        border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: "var(--radius-xl)",
        padding: 36,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08)",
        overflow: "hidden",
      }}>
        {/* Top gradient line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(34,211,238,0.4), transparent)",
        }} />

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(6,182,212,0.2))",
          border: "1px solid rgba(139,92,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, boxShadow: "0 0 24px rgba(139,92,246,0.2)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
          Masukkan password untuk mengakses panel manajemen promo.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <input
              type="password"
              placeholder="Password admin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                width: "100%",
                padding: "13px 16px 13px 44px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: 15,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              background: "var(--red-bg)",
              border: "1px solid var(--red-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--red)",
              fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              padding: "13px",
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
              opacity: (loading || !password.trim()) ? 0.4 : 1,
              transition: "all var(--transition)",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                  borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }} />
                Masuk...
              </>
            ) : "Masuk ke Dashboard"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}>
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    </div>
  );
}
