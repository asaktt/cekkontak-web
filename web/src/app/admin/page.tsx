"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import type { PromoCode } from "@/lib/promoStore";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getStatus(promo: PromoCode): "active" | "inactive" | "expired" {
  if (!promo.isActive) return "inactive";
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return "expired";
  return "active";
}

function formatDate(iso: string | null): string {
  if (!iso) return "∞ Selamanya";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [adding, setAdding] = useState(false);

  // ── Load promos ──────────────────────────────────────────────────────────────
  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promos");
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setPromos(data.promos ?? []);
    } catch {
      showFeedback("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  function showFeedback(msg: string, type: "success" | "error") {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  }

  // ── Add promo ────────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;
    setAdding(true);

    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          isActive: true,
          expiresAt: newExpiry ? new Date(newExpiry).toISOString() : null,
          maxUses: newMaxUses ? parseInt(newMaxUses) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(`✓ Promo "${data.promo.code}" berhasil dibuat`, "success");
        setNewCode("");
        setNewExpiry("");
        setNewMaxUses("");
        loadPromos();
      } else {
        showFeedback(data.error ?? "Gagal membuat promo", "error");
      }
    } catch {
      showFeedback("Gagal terhubung ke server", "error");
    } finally {
      setAdding(false);
    }
  }

  // ── Toggle active ────────────────────────────────────────────────────────────
  async function handleToggle(promo: PromoCode) {
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promo.code, isActive: !promo.isActive }),
      });
      if (res.ok) {
        showFeedback(`Promo "${promo.code}" ${!promo.isActive ? "diaktifkan" : "dinonaktifkan"}`, "success");
        loadPromos();
      }
    } catch {
      showFeedback("Gagal memperbarui promo", "error");
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(code: string) {
    if (!confirm(`Hapus promo "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promos?code=${encodeURIComponent(code)}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback(`Promo "${code}" dihapus`, "success");
        loadPromos();
      }
    } catch {
      showFeedback("Gagal menghapus promo", "error");
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalActive = promos.filter(p => getStatus(p) === "active").length;
  const totalUsed = promos.reduce((s, p) => s + p.usedCount, 0);
  const totalExpired = promos.filter(p => getStatus(p) === "expired").length;

  return (
    <div className={styles.page}>
      <div className={styles.bgAccent} />

      <div className={styles.wrapper}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={styles.brandDot} />
            <span className={styles.brandName}>CekKontak</span>
            <span className={styles.brandTag}>ADMIN</span>
          </div>
          <div className={styles.topbarActions}>
            <a href="/" className={styles.backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Beranda
            </a>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.purple}`}>{promos.length}</div>
            <div className={styles.statLabel}>Total Promo</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.green}`}>{totalActive}</div>
            <div className={styles.statLabel}>Aktif</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.amber}`}>{totalUsed}</div>
            <div className={styles.statLabel}>Kali Dipakai</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.cyan}`}>{totalExpired}</div>
            <div className={styles.statLabel}>Kadaluarsa</div>
          </div>
        </div>

        {/* Promo Management */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Manajemen Kode Promo
            </h2>
            <button
              style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
              onClick={loadPromos}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Add Form */}
          <form className={styles.addForm} onSubmit={handleAdd}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kode Promo</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="GRATIS2025"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  maxLength={32}
                  required
                />
                <button
                  type="button"
                  className={styles.randomBtn}
                  onClick={() => setNewCode(randomCode())}
                  title="Generate random"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Masa Aktif Hingga</label>
              <input
                className={styles.formInput}
                type="datetime-local"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Maks. Pakai</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="∞ Unlimited"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                min={1}
                style={{ width: 130 }}
              />
            </div>

            <button className={styles.addBtn} type="submit" disabled={adding || !newCode.trim()}>
              {adding ? "Menambah..." : "+ Tambah Promo"}
            </button>
          </form>

          {/* Feedback */}
          {feedback && (
            <div className={`${styles.feedback} ${feedback.type === "success" ? styles.success : styles.error}`}>
              {feedback.msg}
            </div>
          )}

          {/* Table */}
          <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.emptyState}>
                <span style={{ display: "inline-block", width: 24, height: 24, border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Memuat data...
              </div>
            ) : promos.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                </svg>
                <p>Belum ada kode promo. Buat promo pertama di atas!</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Status</th>
                    <th>Masa Aktif</th>
                    <th>Dipakai</th>
                    <th>Maks.</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => {
                    const status = getStatus(promo);
                    return (
                      <tr key={promo.code}>
                        <td className={styles.codeCell}>{promo.code}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[status]}`}>
                            <span className={styles.badgeDotSmall} />
                            {status === "active" ? "Aktif" : status === "inactive" ? "Nonaktif" : "Kadaluarsa"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                          {formatDate(promo.expiresAt)}
                        </td>
                        <td style={{ color: "var(--amber)", fontWeight: 700 }}>{promo.usedCount}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {promo.maxUses === null ? "∞" : promo.maxUses}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {formatDate(promo.createdAt)}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={`${styles.actionBtn} ${styles.toggle}`}
                              onClick={() => handleToggle(promo)}
                              title={promo.isActive ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {promo.isActive ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="3" fill="currentColor" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8" cy="12" r="3" fill="currentColor" />
                                </svg>
                              )}
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.delete}`}
                              onClick={() => handleDelete(promo.code)}
                              title="Hapus"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
          CekKontak Admin · Data reset setiap cold start server
        </div>
      </div>
    </div>
  );
}
