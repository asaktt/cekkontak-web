"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Step icons (large, purposeful SVGs) ───────────────────────────────────────
const StepIcons = [
  // Phone icon
  <svg key="phone" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>,
  // Key/unlock icon
  <svg key="key" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>,
  // Eye/view icon
  <svg key="eye" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>,
];

const FEATURES = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    title: "Cek Siapa yang Menyimpan Nomor",
    desc: "Ketahui nama dan label yang disimpan jutaan pengguna GetContact — akurat dan real-time.",
    stat: "10.000+ pencarian/hari",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    title: "Data Tag Real-Time & Akurat",
    desc: "Terhubung langsung ke database GetContact, diperbarui jutaan pengguna setiap harinya.",
    stat: "Update real-time",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Privasi & Keamanan Terjamin",
    desc: "Pencarian bersifat anonim. Transaksi diproses via payment gateway berlisensi Bank Indonesia.",
    stat: "SSL + Enkripsi End-to-End",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Masukkan Nomor HP", desc: "Ketik nomor yang ingin dicek. Format lokal (08xx) atau internasional (+628xx)." },
  { step: "02", title: "Pilih Metode Akses", desc: "Gunakan kode promo gratis, atau bayar Rp 500 via QRIS — selesai dalam detik." },
  { step: "03", title: "Lihat Hasilnya", desc: "Nama lengkap, profil, dan semua tag yang tersimpan langsung tampil." },
];

const STATS = [
  { value: "47.200+", label: "Nomor Dicek" },
  { value: "4.8★", label: "Rating" },
  { value: "<3 dtk", label: "Respons" },
  { value: "99.9%", label: "Uptime" },
];

const PREVIEW_TAGS = ["Sales Marketing", "Ojek Online", "Teman Kuliah", "Kontak Kerja", "Driver Grab"];

// ── Trust badge icon ───────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

// ── Scroll Reveal Hook ─────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const els = document.querySelectorAll(`.${styles.reveal}`);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ phone, onClose, onSearchToken }: {
  phone: string; onClose: () => void; onSearchToken: (token: string) => void;
}) {
  const [tab, setTab] = useState<ModalTab>("promo");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [payStatus, setPayStatus] = useState<PaymentStatus>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState<number>(500);
  const [fee, setFee] = useState<number>(0);
  const [payError, setPayError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  async function handlePromo() {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true); setPromoStatus("checking"); setPromoMsg("");
    try {
      const res = await fetch("/api/promo/use", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promoCode.trim(), phone }) });
      const data = await res.json();
      if (data.success) { setPromoStatus("valid"); setPromoMsg("✓ Kode valid! Sedang memuat hasil..."); setTimeout(() => onSearchToken(data.searchToken), 1000); }
      else { setPromoStatus("invalid"); setPromoMsg(data.reason ?? "Kode promo tidak valid atau sudah habis."); }
    } catch { setPromoStatus("invalid"); setPromoMsg("Gagal menghubungi server. Coba lagi."); }
    finally { setPromoLoading(false); }
  }

  async function handleCreateQris() {
    setPayStatus("creating"); setPayError("");
    try {
      const res = await fetch("/api/payment/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat transaksi");
      setOrderId(data.orderId); setQrString(data.qrString ?? null); setPaymentUrl(data.paymentUrl ?? null);
      setExpiredAt(data.expiredAt ?? null); setActualAmount(data.amount ?? 500); setFee(data.fee ?? 0); setPayStatus("waiting");
      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`/api/payment/status?orderId=${data.orderId}`);
          const sd = await sr.json();
          if (sd.status === "completed" && sd.searchToken) { if (pollRef.current) clearInterval(pollRef.current); setPayStatus("paid"); setTimeout(() => onSearchToken(sd.searchToken), 800); }
          else if (sd.status === "expired") { if (pollRef.current) clearInterval(pollRef.current); setPayStatus("error"); setPayError("Transaksi kadaluarsa. Coba lagi."); }
        } catch { /* ignore */ }
      }, 4000);
    } catch (e: unknown) { setPayStatus("error"); setPayError((e as Error).message); }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalShine} />
        <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className={styles.modalHead}>
          <div className={styles.modalIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h2 className={styles.modalTitle}>Akses Hasil</h2>
            <p className={styles.modalSub}>Pilih metode untuk nomor <strong style={{color:"#f97316"}}>{phone}</strong></p>
          </div>
        </div>

        <div className={styles.chips}>
          {["Hasil instan","Data akurat","Rp 500 saja"].map(v => (
            <span key={v} className={styles.chip}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              {v}
            </span>
          ))}
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "promo" ? styles.tabActive : ""}`} onClick={() => setTab("promo")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Kode Promo <span className={styles.badgeFree}>GRATIS</span>
          </button>
          <button className={`${styles.tab} ${tab === "qris" ? styles.tabActive : ""}`} onClick={() => setTab("qris")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            QRIS <span className={styles.badgePrice}>Rp 500</span>
          </button>
        </div>

        {tab === "promo" && (
          <div className={styles.panel}>
            <p className={styles.panelHint}>Masukkan kode promo untuk akses gratis.</p>
            <input
              className={`${styles.promoInput} ${promoStatus === "valid" ? styles.inputValid : ""} ${promoStatus === "invalid" ? styles.inputInvalid : ""}`}
              type="text" placeholder="Contoh: COBA2025" value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoStatus("idle"); setPromoMsg(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePromo()}
              disabled={promoLoading || promoStatus === "valid"} maxLength={32} autoFocus />
            {promoMsg && <div className={`${styles.feedback} ${promoStatus === "valid" ? styles.feedbackOk : styles.feedbackErr}`}>{promoMsg}</div>}
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handlePromo} disabled={!promoCode.trim() || promoLoading || promoStatus === "valid"}>
              {promoLoading ? <><span className={styles.spin}/> Memeriksa...</> : "Gunakan Kode Promo"}
            </button>
          </div>
        )}

        {tab === "qris" && (
          <div className={styles.panel}>
            {payStatus === "idle" && (<>
              <div className={styles.priceBox}>
                <span className={styles.priceAmt}>Rp 500</span>
                <span className={styles.priceLbl}>sekali bayar · tidak berulang</span>
              </div>
              <div className={styles.qrisPlaceholder}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="21" y2="14"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg>
                <span>Klik tombol untuk generate QRIS</span>
              </div>
              <div className={styles.methods}>{["GoPay","OVO","DANA","ShopeePay","m-Banking"].map(m=><span key={m}>{m}</span>)}</div>
              <button className={`${styles.btn} ${styles.btnOrange}`} onClick={handleCreateQris}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Generate QRIS — Bayar Rp 500
              </button>
            </>)}
            {payStatus === "creating" && <div className={styles.centered}><span className={styles.spin} style={{width:32,height:32,borderWidth:3}}/><span className={styles.stLbl}>Membuat transaksi...</span></div>}
            {payStatus === "waiting" && (<>
              <div className={styles.qrisFrame}><div className={styles.qrisInner}>
                {qrString ? <QRCodeSVG value={qrString} size={196} bgColor="#fff" fgColor="#000" level="M"/> : <div className={styles.qrisPlaceholder} style={{minWidth:196,minHeight:196}}><span>QR tidak tersedia</span></div>}
              </div></div>
              <div className={styles.amtRow}>
                <span className={styles.amtLbl}>Bayar tepat</span>
                <span className={styles.amtVal}>Rp {actualAmount.toLocaleString("id-ID")}</span>
                {actualAmount!==500&&fee>0&&<span className={styles.amtNote}>+Rp {fee} kode unik</span>}
              </div>
              {orderId && <div className={styles.orderId}>Order: {orderId}</div>}
              {expiredAt && <div className={styles.expiry}>Berlaku hingga {new Date(expiredAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</div>}
              <div className={styles.waitRow}><span className={styles.pulseDot}/>Menunggu konfirmasi...</div>
              {paymentUrl && <p className={styles.qrisHint}>Atau <a href={paymentUrl} target="_blank" rel="noreferrer" style={{color:"#f97316",fontWeight:600}}>buka halaman pembayaran</a></p>}
            </>)}
            {payStatus === "paid" && (
              <div className={styles.centered}>
                <div className={styles.successIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg></div>
                <div className={styles.successTxt}>Pembayaran Berhasil!</div>
                <div className={styles.successSub}>Memuat hasil...</div>
                <span className={styles.spin}/>
              </div>
            )}
            {payStatus === "error" && (<>
              <div className={styles.errCard}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {payError}
              </div>
              <button className={`${styles.btn} ${styles.btnOrange}`} onClick={()=>{setPayStatus("idle");setPayError("");setOrderId(null);setQrString(null);setPaymentUrl(null);}}>Coba Lagi</button>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useScrollReveal();

  const displayName = result?.profile?.displayName || [result?.profile?.name, result?.profile?.surname].filter(Boolean).join(" ") || "—";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [result]);

  const executeSearch = useCallback(async (searchToken: string, phoneNum: string) => {
    setShowModal(false); setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneNum.trim(), searchToken }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Terjadi kesalahan"); else setResult(data);
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setResult(null); setError(null); setShowModal(true);
  }

  function handleClear() {
    setPhone(""); setResult(null); setError(null); inputRef.current?.focus();
  }

  function scrollToSearch() {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <div className={styles.page}>

        {/* ── NAVBAR ─────────────────────────────────────── */}
        <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`} aria-label="Navigasi utama">
          <div className={styles.navInner}>
            {/* Brand with logo image */}
            <a href="/" className={styles.brand} aria-label="CekKontak — Beranda">
              <Image
                src="/favicon.png"
                alt="CekKontak logo"
                width={28}
                height={28}
                className={styles.brandLogo}
                priority
              />
              <span className={styles.brandName}>CekKontak</span>
              <span className={styles.brandDot} aria-hidden="true"/>
            </a>
            <div className={`${styles.navLinks} ${mobileNav ? styles.navLinksOpen : ""}`}>
              <a href="#cara-kerja" className={styles.navLink} onClick={() => setMobileNav(false)}>Cara Kerja</a>
              <a href="#fitur" className={styles.navLink} onClick={() => setMobileNav(false)}>Fitur</a>
              <a href="#testimoni" className={styles.navLink} onClick={() => setMobileNav(false)}>Testimoni</a>
            </div>
            <button
              className={styles.navCta}
              onClick={() => { setMobileNav(false); scrollToSearch(); }}
              aria-label="Cek nomor sekarang"
            >
              Cek Nomor →
            </button>
            {/* Hamburger — mobile only */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileNav(p => !p)}
              aria-label={mobileNav ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileNav}
            >
              {mobileNav
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className={styles.hero} aria-label="Pencarian nomor HP">
          {/* Background glows */}
          <div className={styles.heroGlow1} aria-hidden="true"/>
          <div className={styles.heroGlow2} aria-hidden="true"/>
          <div className={styles.heroGlow3} aria-hidden="true"/>

          <div className={styles.heroContent}>
            {/* Announcement badge */}
            <div className={styles.annBadge}>
              <span className={styles.annNew}>Baru</span>
              <span className={styles.annText}>Kode Promo — Akses Gratis Tanpa Bayar →</span>
            </div>

            <h1 className={styles.heroH1}>
              Cari Tahu Siapa<br/>
              <span className={styles.heroAccent}>di Balik Nomor Itu</span>
            </h1>

            <p className={styles.heroP}>
              Lacak nama, reputasi, dan label yang disimpan jutaan pengguna GetContact
              untuk nomor HP manapun — dalam hitungan detik.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className={styles.searchForm} role="search" aria-label="Form pencarian nomor HP">
              <div className={styles.searchInputWrap}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <input
                  ref={inputRef}
                  id="phone-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={styles.searchInput}
                  placeholder="Contoh: 0812-3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  aria-label="Nomor HP yang ingin dicek"
                />
                {phone && (
                  <button type="button" className={styles.clearBtn} onClick={handleClear} aria-label="Hapus nomor">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                id="search-btn"
                className={styles.searchBtn}
                disabled={loading || !phone.trim()}
                aria-busy={loading}
              >
                {loading
                  ? <><span className={styles.spin} aria-hidden="true"/> Mencari...</>
                  : <><span className={styles.btnTxtFull}>Cek Sekarang</span><span className={styles.btnTxtShort}>Cek</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></>
                }
              </button>
            </form>

            {/* Trust badges — social proof */}
            <div className={styles.trustBadges} aria-label="Keamanan dan kepercayaan">
              <span className={styles.trustBadge}>
                <CheckIcon/> SSL Terenkripsi
              </span>
              <span className={styles.trustDivider} aria-hidden="true"/>
              <span className={styles.trustBadge}>
                <CheckIcon/> Lisensi Bank Indonesia
              </span>
              <span className={styles.trustDivider} aria-hidden="true"/>
              <span className={styles.trustBadge}>
                <CheckIcon/> 99.9% Uptime
              </span>
            </div>

            <p className={styles.searchHint}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
              Gratis dengan kode promo · atau hanya Rp 500 via QRIS
            </p>

            {/* Stats — boxed layout */}
            <div className={styles.heroStats} aria-label="Statistik layanan">
              {STATS.map(s => (
                <div key={s.label} className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{s.value}</span>
                  <span className={styles.heroStatLbl}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sun ring — signature visual anchor */}
          <div className={styles.sunRing} aria-hidden="true">
            <div className={styles.sunInner}/>
          </div>
        </section>

        {/* ── ERROR ────────────────────────────────────────── */}
        {error && (
          <div className={styles.errWrap} role="alert">
            <div className={styles.errCard}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────────── */}
        {result && (
          <section ref={resultRef} className={styles.resultSection} aria-live="polite" aria-label="Hasil pencarian">
            <div className={styles.resultWrap}>
              <div className={styles.card}>
                <div className={styles.cardGlow}/>
                <div className={styles.resultBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  Hasil Ditemukan
                </div>
                <div className={styles.profileRow}>
                  <div className={styles.avatar} aria-hidden="true">{displayName !== "—" ? displayName.charAt(0).toUpperCase() : "?"}</div>
                  <div className={styles.profileInfo}>
                    <h2 className={styles.profileName}>{displayName}</h2>
                    <p className={styles.profilePhone}>{result.profile?.displayNumber || result.phone}</p>
                  </div>
                  <div className={styles.tagBadge} aria-label={`${result.profile?.tagCount ?? result.tags.length} tags`}>
                    <span className={styles.tagNum}>{result.profile?.tagCount ?? result.tags.length}</span>
                    <span className={styles.tagLbl}>Tags</span>
                  </div>
                </div>
                {result.profile?.email && (
                  <div className={styles.infoRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span>{result.profile.email}</span>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.tagsHead}>
                  <h3 className={styles.tagsTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    Label yang Disimpan
                  </h3>
                  {result.tags.length > 0 && <span className={styles.tagTotal}>{result.tags.length} label</span>}
                </div>
                {result.tags.length === 0 ? (
                  <div className={styles.emptyTags}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>
                    <p>Belum ada label untuk nomor ini.</p>
                  </div>
                ) : (
                  <div className={styles.tagsGrid}>
                    {result.tags.map((t, i) => (
                      <div key={i} className={styles.tagItem}>
                        <span className={styles.tagText}>{t.tag}</span>
                        {t.count > 0 && <span className={styles.tagCnt}>×{t.count}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search again */}
              <button className={`${styles.btn} ${styles.btnGhost}`} style={{marginTop:8}} onClick={handleClear}>
                ← Cek Nomor Lain
              </button>
            </div>
          </section>
        )}

        {/* ── Preview result (only when no result yet) ──────── */}
        {!result && !loading && (
          <div className={styles.previewWrap}>
            <div className={styles.previewCard}>
              <div className={styles.previewGlow}/>
              <div className={styles.previewHead}>
                <span className={styles.previewDot}/>
                <span className={styles.previewLbl}>Contoh Hasil</span>
              </div>
              <div className={styles.previewProfile}>
                <div className={styles.previewAvatar} aria-hidden="true">A</div>
                <div className={styles.previewInfo}>
                  <span className={styles.previewName}>Andi Pratama</span>
                  <span className={styles.previewPhone}>+62 812-xxxx-xxxx</span>
                </div>
                <div className={styles.previewCnt}>
                  <span className={styles.previewNum}>7</span>
                  <span className={styles.previewLblSm}>tags</span>
                </div>
              </div>
              <div className={styles.previewTags}>
                {PREVIEW_TAGS.map((t,i) => (
                  <span key={t} className={`${styles.previewTag} ${i>=3?styles.previewTagBlur:""}`}>{t}</span>
                ))}
              </div>
              <div className={styles.previewLock}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Bayar Rp 500 untuk lihat data asli
              </div>
            </div>
          </div>
        )}

        {/* ── MARQUEE ──────────────────────────────────────── */}
        {!result && !loading && (
          <div className={styles.marqueeSection} aria-label="Platform pembayaran yang didukung">
            <p className={styles.marqueeLbl}>Didukung oleh platform pembayaran terpercaya</p>
            <div className={styles.marqueeTrack} aria-hidden="true">
              <div className={styles.marqueeItems}>
                {["GoPay","OVO","DANA","ShopeePay","BCA Mobile","Mandiri","LinkAja","GoPay","OVO","DANA","ShopeePay","BCA Mobile","Mandiri","LinkAja"].map((n,i) => (
                  <span key={`${n}-${i}`} className={styles.marqueeItem}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FAQ SECTION — GEO optimized ──────────────────── */}
        {!result && !loading && (
          <section className={styles.section} aria-labelledby="faq-heading">
            <div className={styles.sectionInner}>
              <div className={`${styles.sectionHead} ${styles.reveal}`}>
                <span className={styles.pill}>FAQ</span>
                <h2 id="faq-heading" className={styles.sectionH2}>Pertanyaan Umum</h2>
                <p className={styles.sectionP}>Jawaban cepat untuk yang paling sering ditanyakan.</p>
              </div>
              <div className={styles.faqList}>
                {[
                  { q: "Apakah pencarian anonim?", a: "Ya. Pemilik nomor tidak diberitahu bahwa nomornya dicek." },
                  { q: "Berapa biayanya?", a: "Hanya Rp 500 per cek via QRIS — atau gratis dengan kode promo." },
                  { q: "Metode pembayaran apa yang didukung?", a: "Semua QRIS: GoPay, OVO, DANA, ShopeePay, LinkAja, dan semua mobile banking." },
                  { q: "Seberapa akurat datanya?", a: "Data langsung dari database GetContact yang diperbarui jutaan pengguna setiap hari." },
                  { q: "Apakah perlu daftar akun?", a: "Tidak. Tidak ada registrasi, tidak ada login — langsung cek nomor." },
                  { q: "Format nomor apa yang bisa dicek?", a: "Format lokal (08xx) atau internasional (+628xx) — keduanya didukung." },
                ].map((item, i) => (
                  <div key={i} className={`${styles.faqItem} ${styles.reveal}`} style={{transitionDelay:`${i*60}ms`}}>
                    <div className={styles.faqQ}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      {item.q}
                    </div>
                    <p className={styles.faqA}>{item.a}</p>
                  </div>
                ))}
              </div>
              <div className={styles.faqMore}>
                <a href="/faq" className={styles.faqMoreLink}>Lihat semua pertanyaan →</a>
              </div>
            </div>
          </section>
        )}

        {/* ── CARA KERJA ───────────────────────────────────── */}
        {!result && !loading && (
          <section id="cara-kerja" className={styles.section} aria-labelledby="cara-kerja-heading">
            <div className={styles.sectionInner}>
              <div className={`${styles.sectionHead} ${styles.reveal}`}>
                <span className={styles.pill}>Cara Kerja</span>
                <h2 id="cara-kerja-heading" className={styles.sectionH2}>Tiga Langkah Simpel</h2>
                <p className={styles.sectionP}>Mulai cek nomor dalam hitungan detik — tanpa registrasi, tanpa ribet.</p>
              </div>
              <div className={styles.stepsGrid}>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={s.step} className={`${styles.stepCard} ${styles.reveal}`} style={{transitionDelay:`${i*100}ms`}}>
                    {/* Large icon */}
                    <div className={styles.stepIconWrap} aria-hidden="true">
                      {StepIcons[i]}
                    </div>
                    <div className={styles.stepNum}>LANGKAH {s.step}</div>
                    <div className={styles.stepTitle}>{s.title}</div>
                    <div className={styles.stepDesc}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FITUR ────────────────────────────────────────── */}
        {!result && !loading && (
          <section id="fitur" className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="fitur-heading">
            <div className={styles.sectionInner}>
              <div className={`${styles.sectionHead} ${styles.reveal}`}>
                <span className={styles.pill}>Fitur</span>
                <h2 id="fitur-heading" className={styles.sectionH2}>Mengapa CekKontak?</h2>
                <p className={styles.sectionP}>Dirancang untuk kecepatan, akurasi, dan privasi penuh.</p>
              </div>
              <div className={styles.featsGrid}>
                {FEATURES.map((f, i) => (
                  <div key={i} className={`${styles.featCard} ${styles.reveal}`} style={{transitionDelay:`${i*100}ms`}}>
                    <div className={styles.featIcon} aria-hidden="true">{f.icon}</div>
                    <div className={styles.featTitle}>{f.title}</div>
                    <div className={styles.featDesc}>{f.desc}</div>
                    <div className={styles.featStat}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                      {f.stat}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONI ────────────────────────────────────── */}
        {!result && !loading && (
          <section id="testimoni" className={styles.section} aria-labelledby="testimoni-heading">
            <div className={styles.sectionInner}>
              <div className={`${styles.sectionHead} ${styles.reveal}`}>
                <span className={styles.pill}>Testimoni</span>
                <h2 id="testimoni-heading" className={styles.sectionH2}>Dipercaya Pengguna</h2>
                <p className={styles.sectionP}>Ribuan pengguna sudah membuktikan manfaat CekKontak.</p>
              </div>
              <div className={styles.testGrid}>
                {[
                  { text: "Berguna banget! Langsung ketahuan nama orang yang sering telepon spam ke kantor saya.", author: "Budi S.", role: "Pebisnis, Jakarta" },
                  { text: "Prosesnya cepat, bayar pakai GoPay langsung jadi. Hasilnya akurat dan lengkap banget.", author: "Rina A.", role: "Freelancer, Bandung" },
                  { text: "Saya pakai buat verifikasi kontak sebelum meeting. Sangat membantu untuk due diligence.", author: "Dian P.", role: "Konsultan, Surabaya" },
                ].map((t, i) => (
                  <div key={i} className={`${styles.testCard} ${styles.reveal}`} style={{transitionDelay:`${i*100}ms`}}>
                    <div className={styles.testStars} aria-label="5 bintang">★★★★★</div>
                    <p className={styles.testTxt}>&ldquo;{t.text}&rdquo;</p>
                    <div className={styles.testAuthor}>
                      <div className={styles.testAvatar} aria-hidden="true">{t.author.charAt(0)}</div>
                      <div>
                        <div className={styles.testName}>{t.author}</div>
                        <div className={styles.testRole}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA — Premium redesign ────────────────────────── */}
        {!result && !loading && (
          <section className={styles.ctaSection} aria-labelledby="cta-heading">
            <div className={styles.ctaGlow} aria-hidden="true"/>
            <div className={styles.ctaBorder} aria-hidden="true"/>
            <div className={`${styles.ctaContent} ${styles.reveal}`}>
              <span className={styles.ctaEyebrow}>Mulai Gratis</span>
              <h2 id="cta-heading" className={styles.ctaH2}>
                Cek Nomor HP<br/>
                <span className={styles.heroAccent}>Sekarang Juga</span>
              </h2>
              <p className={styles.ctaP}>
                Gratis dengan kode promo · atau hanya Rp 500 sekali bayar.<br/>
                Tanpa registrasi. Hasil instan dalam detik.
              </p>
              <button className={styles.ctaBtn} onClick={scrollToSearch} id="cta-main-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Cek Nomor Sekarang
              </button>
              <p className={styles.ctaSubtext}>
                <span><CheckIcon/> Anonim</span>
                <span><CheckIcon/> Tanpa daftar</span>
                <span><CheckIcon/> Hasil instan</span>
              </p>
            </div>
          </section>
        )}

        {/* ── FOOTER — Professional ─────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            {/* Brand column */}
            <div className={styles.footerBrand}>
              <div className={styles.brand} style={{textDecoration:"none"}}>
                <Image src="/favicon.png" alt="CekKontak" width={24} height={24} className={styles.brandLogo}/>
                <span className={styles.brandName}>CekKontak</span>
                <span className={styles.brandDot} aria-hidden="true"/>
              </div>
              <p className={styles.footerTagline}>
                Layanan pengecekan nomor HP terpercaya berbasis teknologi GetContact — cepat, akurat, aman.
              </p>
              {/* Trust badges in footer */}
              <div className={styles.footerBadges}>
                <span className={styles.footerBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  SSL
                </span>
                <span className={styles.footerBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  Lisensi BI
                </span>
                <span className={styles.footerBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  99.9% Uptime
                </span>
              </div>
            </div>

            {/* Links columns */}
            <div className={styles.footerLinks}>
              <div>
                <p className={styles.footerLinkHd}>Layanan</p>
                <a href="#cara-kerja" className={styles.footerLink}>Cara Kerja</a>
                <a href="#fitur" className={styles.footerLink}>Fitur</a>
                <a href="#testimoni" className={styles.footerLink}>Testimoni</a>
              </div>
              <div>
                <p className={styles.footerLinkHd}>Pembayaran</p>
                <span className={styles.footerLink}>GoPay</span>
                <span className={styles.footerLink}>OVO</span>
                <span className={styles.footerLink}>DANA</span>
                <span className={styles.footerLink}>ShopeePay</span>
              </div>
              <div>
                <p className={styles.footerLinkHd}>Legal</p>
                <a href="/privacy" className={styles.footerLink}>Kebijakan Privasi</a>
                <a href="/terms" className={styles.footerLink}>Syarat &amp; Ketentuan</a>
                <a href="/faq" className={styles.footerLink}>FAQ</a>
                <a href="mailto:support@cekkontak.online" className={styles.footerLink}>Hubungi Kami</a>
              </div>
            </div>
          </div>
          <div className={styles.footerDivider}/>
          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} CekKontak. Hak cipta dilindungi undang-undang.</p>
            <p>Data digunakan sesuai ketentuan layanan GetContact.</p>
          </div>
        </footer>
      </div>

      {showModal && (
        <PaymentModal phone={phone} onClose={() => setShowModal(false)} onSearchToken={(token) => executeSearch(token, phone)}/>
      )}
    </>
  );
}
