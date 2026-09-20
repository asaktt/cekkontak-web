"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./page.module.css";

// ── Types ────────────────────────────────────────────────────────────────────
interface TagItem { tag: string; count: number; }
interface Profile {
  displayName: string | null; name: string | null; surname: string | null;
  phoneNumber: string; displayNumber: string | null;
  tagCount: number; email: string | null;
}
interface SearchResult { phone: string; profile: Profile | null; tags: TagItem[]; tagsFetched: boolean; }
type ModalTab = "promo" | "qris";
type PaymentStatus = "idle" | "creating" | "waiting" | "paid" | "error";
type PromoStatus = "idle" | "checking" | "valid" | "invalid";

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  phone,
  onClose,
  onSearchToken,
}: {
  phone: string;
  onClose: () => void;
  onSearchToken: (token: string) => void;
}) {
  const [tab, setTab] = useState<ModalTab>("promo");

  // Promo state
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // QRIS / Payment state
  const [payStatus, setPayStatus] = useState<PaymentStatus>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Promo handler ──────────────────────────────────────────────────────────
  async function handlePromo() {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    setPromoStatus("checking");
    setPromoMsg("");

    try {
      const res = await fetch("/api/promo/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), phone }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoStatus("valid");
        setPromoMsg("✓ Promo berhasil! Memulai pencarian...");
        setTimeout(() => onSearchToken(data.searchToken), 1000);
      } else {
        setPromoStatus("invalid");
        setPromoMsg(data.reason ?? "Kode promo tidak valid");
      }
    } catch {
      setPromoStatus("invalid");
      setPromoMsg("Gagal menghubungi server");
    } finally {
      setPromoLoading(false);
    }
  }

  // ── QRIS handler ───────────────────────────────────────────────────────────
  async function handleCreateQris() {
    setPayStatus("creating");
    setPayError("");

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat transaksi");

      setOrderId(data.orderId);
      setQrisUrl(data.qrisUrl ?? null);
      setPayStatus("waiting");

      // Poll for payment status every 3 seconds
      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`/api/payment/status?orderId=${data.orderId}`);
          const sd = await sr.json();
          if (sd.status === "completed" && sd.searchToken) {
            if (pollRef.current) clearInterval(pollRef.current);
            setPayStatus("paid");
            setTimeout(() => onSearchToken(sd.searchToken), 800);
          } else if (sd.status === "expired") {
            if (pollRef.current) clearInterval(pollRef.current);
            setPayStatus("error");
            setPayError("Transaksi kadaluarsa. Coba lagi.");
          }
        } catch { /* ignore poll errors */ }
      }, 3000);

    } catch (e: unknown) {
      setPayStatus("error");
      setPayError((e as Error).message);
    }
  }

  const promoInputClass = [
    styles.modalPromoInput,
    promoStatus === "valid" ? styles.validState : "",
    promoStatus === "invalid" ? styles.invalidState : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className={styles.modalTitle}>Akses Premium</h2>
        <p className={styles.modalSubtitle}>
          Gunakan kode promo gratis atau bayar <strong style={{ color: "var(--amber)" }}>Rp 500</strong> via QRIS untuk melihat hasil.
        </p>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "promo" ? styles.activeTab : ""}`}
            onClick={() => setTab("promo")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Kode Promo
          </button>
          <button
            className={`${styles.tab} ${tab === "qris" ? styles.activeTab : ""}`}
            onClick={() => setTab("qris")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><line x1="14" y1="14" x2="21" y2="14" />
              <line x1="21" y1="14" x2="21" y2="21" /><line x1="14" y1="21" x2="21" y2="21" />
            </svg>
            Bayar QRIS
          </button>
        </div>

        {/* Promo Panel */}
        {tab === "promo" && (
          <div className={styles.promoPanel}>
            <input
              className={promoInputClass}
              type="text"
              placeholder="Masukkan kode promo..."
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoStatus("idle");
                setPromoMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePromo()}
              disabled={promoLoading || promoStatus === "valid"}
              maxLength={32}
              autoFocus
            />
            {promoMsg && (
              <div className={`${styles.promoFeedback} ${promoStatus === "valid" ? styles.success : styles.error}`}>
                {promoMsg}
              </div>
            )}
            <button
              className={`${styles.modalBtn} ${styles.secondary}`}
              onClick={handlePromo}
              disabled={!promoCode.trim() || promoLoading || promoStatus === "valid"}
            >
              {promoLoading ? (
                <><span className={styles.spinner} /> Memeriksa...</>
              ) : "Gunakan Promo"}
            </button>
          </div>
        )}

        {/* QRIS Panel */}
        {tab === "qris" && (
          <div className={styles.qrisPanel}>
            {payStatus === "idle" && (
              <>
                <div className={styles.qrisFrame}>
                  <div className={styles.qrisInner}>
                    <div className={styles.qrisPlaceholder}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <line x1="14" y1="14" x2="21" y2="14" /><line x1="21" y1="14" x2="21" y2="21" />
                        <line x1="14" y1="21" x2="21" y2="21" />
                      </svg>
                      <span>Klik tombol di bawah<br/>untuk generate QRIS</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className={styles.qrisAmount}>Rp 500</div>
                  <div className={styles.qrisAmountLabel}>per pengecekan nomor</div>
                </div>
                <button className={`${styles.modalBtn} ${styles.primary}`} onClick={handleCreateQris}>
                  Generate QRIS Bayar
                </button>
              </>
            )}

            {payStatus === "creating" && (
              <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <span className={styles.spinner} style={{ width: 32, height: 32, borderWidth: 3 }} />
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Membuat transaksi QRIS...</span>
              </div>
            )}

            {payStatus === "waiting" && (
              <>
                <div className={styles.qrisFrame}>
                  <div className={styles.qrisInner}>
                    {qrisUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.qrisImage} src={qrisUrl} alt="QRIS" />
                    ) : (
                      <div className={styles.qrisPlaceholder}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span style={{ fontSize: 12, color: "#888" }}>Buka Pakasir untuk scan</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.qrisAmount}>Rp 500</div>
                {orderId && <div className={styles.orderId}>ID: {orderId}</div>}
                <div className={styles.waitingPulse}>
                  <span className={styles.pulseDot} />
                  Menunggu pembayaran...
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                  Scan QR di atas menggunakan aplikasi e-wallet / m-banking. <br/>
                  Pembayaran akan terverifikasi otomatis.
                </p>
              </>
            )}

            {payStatus === "paid" && (
              <div className={styles.paymentSuccess}>
                <div className={styles.successIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div className={styles.successText}>Pembayaran Berhasil!</div>
                <div className={styles.successSub}>Memuat hasil pencarian...</div>
                <span className={styles.spinner} />
              </div>
            )}

            {payStatus === "error" && (
              <>
                <div className={styles.errorCard} style={{ width: "100%" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {payError}
                </div>
                <button
                  className={`${styles.modalBtn} ${styles.primary}`}
                  onClick={() => { setPayStatus("idle"); setPayError(""); setOrderId(null); setQrisUrl(null); }}
                >
                  Coba Lagi
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName =
    result?.profile?.displayName ||
    [result?.profile?.name, result?.profile?.surname].filter(Boolean).join(" ") ||
    "—";

  // ── Execute search with token ───────────────────────────────────────────────
  const executeSearch = useCallback(async (searchToken: string, phoneNum: string) => {
    setShowModal(false);
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNum.trim(), searchToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
      } else {
        setResult(data);
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Form submit → show payment modal ───────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setResult(null);
    setError(null);
    setShowModal(true);
  }

  function handleClear() {
    setPhone("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <>
      <main className={styles.main}>
        {/* Background */}
        <div className={styles.bgMesh} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.gridOverlay} />

        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              GetContact Lookup
            </div>
            <h1 className={styles.title}>
              Cek <span className={styles.gradientText}>Kontak</span>
            </h1>
            <p className={styles.subtitle}>
              Temukan nama dan tag yang disimpan orang lain untuk nomor HP manapun secara instan.
            </p>
            <div className={styles.priceBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Rp 500 / cek · Gratis dengan kode promo
            </div>
          </header>

          {/* Search Card */}
          <div className={styles.searchCard}>
            <form onSubmit={handleSearch} className={styles.inputGroup}>
              <label className={styles.inputLabel}>Nomor HP</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.input}
                  placeholder="08xxxxxxxxxx atau +628xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                {phone && (
                  <button type="button" className={styles.clearBtn} onClick={handleClear} aria-label="Hapus">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={styles.searchBtn}
                disabled={loading || !phone.trim()}
              >
                {loading ? (
                  <><span className={styles.spinner} /> Mencari...</>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Cek Nomor
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorCard}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={styles.resultWrapper}>
              {/* Profile Card */}
              <div className={styles.card}>
                <div className={styles.profileGlow} />
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {displayName !== "—" ? displayName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className={styles.cardHeaderInfo}>
                    <h2 className={styles.displayName}>{displayName}</h2>
                    <p className={styles.phoneNum}>{result.profile?.displayNumber || result.phone}</p>
                  </div>
                  <div className={styles.tagCountBadge}>
                    <span className={styles.tagCountNum}>{result.profile?.tagCount ?? result.tags.length}</span>
                    <span className={styles.tagCountLabel}>tags</span>
                  </div>
                </div>
                {result.profile?.email && (
                  <div className={styles.infoRow}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>{result.profile.email}</span>
                  </div>
                )}
              </div>

              {/* Tags Card */}
              <div className={styles.card}>
                <div className={styles.tagsHeader}>
                  <h3 className={styles.tagsTitle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    Daftar Tag
                  </h3>
                  {result.tags.length > 0 && (
                    <span className={styles.tagTotalBadge}>{result.tags.length} tag</span>
                  )}
                </div>
                {result.tags.length === 0 ? (
                  <div className={styles.emptyTags}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    </svg>
                    <p>Tidak ada tag yang ditemukan</p>
                  </div>
                ) : (
                  <div className={styles.tagsGrid}>
                    {result.tags.map((t, i) => (
                      <div key={i} className={styles.tagItem}>
                        <span className={styles.tagText}>{t.tag}</span>
                        {t.count > 0 && <span className={styles.tagCount}>×{t.count}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className={styles.footer}>
            <p>Untuk tujuan edukasi dan riset. Gunakan secara bertanggung jawab.</p>
            <p style={{ marginTop: 6 }}>
              <a href="/admin" className={styles.footerLink}>Admin Dashboard</a>
            </p>
          </footer>
        </div>
      </main>

      {/* Payment Modal */}
      {showModal && (
        <PaymentModal
          phone={phone}
          onClose={() => setShowModal(false)}
          onSearchToken={(token) => executeSearch(token, phone)}
        />
      )}
    </>
  );
}
