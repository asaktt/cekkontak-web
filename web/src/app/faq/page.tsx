import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ CekKontak — Pertanyaan yang Sering Ditanyakan",
  description:
    "Jawaban lengkap untuk pertanyaan umum tentang CekKontak: cara kerja, biaya, keamanan, metode pembayaran, dan perbedaan dengan aplikasi GetContact.",
  alternates: { canonical: "https://cekkontak.online/faq" },
  openGraph: {
    title: "FAQ CekKontak — Pertanyaan yang Sering Ditanyakan",
    description: "Semua yang perlu kamu tahu tentang layanan CekKontak.",
    url: "https://cekkontak.online/faq",
  },
};

const FAQS = [
  {
    q: "Apa itu CekKontak?",
    a: "CekKontak adalah layanan web yang memungkinkan siapa saja mengecek nama dan label (tag) yang disimpan pengguna GetContact untuk nomor HP tertentu. Tidak perlu install aplikasi — cukup buka browser, masukkan nomor, dan lihat hasilnya dalam detik.",
  },
  {
    q: "Bagaimana cara kerja CekKontak?",
    a: "Ketik nomor HP yang ingin dicek (format 08xx atau +628xx), lalu pilih metode akses: gunakan kode promo gratis atau bayar Rp 500 via QRIS. Data diambil langsung dari database GetContact yang diperbarui jutaan pengguna setiap hari.",
  },
  {
    q: "Apakah CekKontak aman dan legal?",
    a: "Ya. CekKontak menggunakan enkripsi SSL/TLS untuk semua transmisi data. Pembayaran diproses via payment gateway berlisensi Bank Indonesia. Data yang ditampilkan bersumber dari platform GetContact yang beroperasi secara legal di Indonesia.",
  },
  {
    q: "Apakah pemilik nomor tahu kalau nomornya dicek?",
    a: "Tidak. Pencarian di CekKontak sepenuhnya anonim. Pemilik nomor tidak mendapatkan notifikasi apapun bahwa nomornya dicek.",
  },
  {
    q: "Berapa biaya menggunakan CekKontak?",
    a: "Hanya Rp 500 per satu kali pencarian via QRIS — jauh lebih murah dari pulsa atau biaya registrasi aplikasi. Kamu juga bisa mendapatkan akses gratis menggunakan kode promo yang tersedia.",
  },
  {
    q: "Metode pembayaran apa yang didukung?",
    a: "CekKontak menerima semua pembayaran via QRIS termasuk GoPay, OVO, DANA, ShopeePay, LinkAja, BCA Mobile, Mandiri, BNI, dan semua e-wallet atau mobile banking yang mendukung QRIS.",
  },
  {
    q: "Apa bedanya CekKontak dengan aplikasi GetContact langsung?",
    a: "GetContact adalah aplikasi mobile yang memerlukan instalasi, izin akses kontak, dan registrasi akun. CekKontak lebih cepat dan simpel — tidak perlu install, tidak perlu daftar, langsung cek nomor dari browser. Cocok untuk pengecekan sesekali.",
  },
  {
    q: "Format nomor apa yang bisa dicek?",
    a: "CekKontak mendukung nomor format lokal Indonesia (08xx-xxxx-xxxx) maupun format internasional (+628xx-xxxx-xxxx). Kamu bisa memasukkan nomor dengan atau tanpa tanda hubung.",
  },
  {
    q: "Seberapa akurat data yang ditampilkan?",
    a: "Data bersumber langsung dari database GetContact yang dikontribusikan oleh jutaan pengguna aktif di seluruh dunia, termasuk Indonesia. Akurasi bergantung pada seberapa banyak pengguna GetContact yang menyimpan nomor tersebut.",
  },
  {
    q: "Apakah ada batas jumlah pencarian?",
    a: "Tidak ada batas pencarian per pengguna. Setiap pencarian memerlukan pembayaran Rp 500 atau satu penggunaan kode promo. Kamu bisa melakukan pencarian sebanyak yang dibutuhkan.",
  },
  {
    q: "Bagaimana cara mendapatkan kode promo?",
    a: "Kode promo CekKontak dibagikan melalui media sosial dan program promosi kami. Pantau akun resmi CekKontak untuk informasi kode promo terbaru.",
  },
  {
    q: "Apa yang harus dilakukan jika pembayaran gagal?",
    a: "Jika QRIS kadaluarsa sebelum pembayaran selesai, kamu bisa generate QRIS baru tanpa biaya tambahan. Jika ada masalah teknis, hubungi kami di support@cekkontak.online.",
  },
];

export default function FAQPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "var(--font-dm-sans, 'DM Sans'), system-ui, sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 1080,
        margin: "0 auto",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "#fff",
          textDecoration: "none",
        }}>
          ← CekKontak
        </Link>
        <span style={{ fontSize: 13, color: "#6b7280" }}>FAQ</span>
      </nav>

      {/* Hero */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.22)",
          borderRadius: 100,
          padding: "4px 14px",
          fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: "#f97316",
          letterSpacing: "0.8px",
          textTransform: "uppercase" as const,
          marginBottom: 16,
        }}>FAQ</div>

        <h1 style={{
          fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
          fontSize: "clamp(28px, 5vw, 44px)",
          fontWeight: 800,
          letterSpacing: "-1.5px",
          marginBottom: 12,
          lineHeight: 1.1,
        }}>Pertanyaan yang Sering Ditanyakan</h1>

        <p style={{ color: "#9ca3af", fontSize: 15, marginBottom: 52, lineHeight: 1.7 }}>
          Semua yang perlu kamu tahu tentang cara kerja, biaya, dan keamanan CekKontak.
          Tidak menemukan jawaban? <a href="mailto:support@cekkontak.online" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Hubungi kami</a>.
        </p>

        {/* TL;DR Summary — GEO friendly */}
        <div style={{
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.15)",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 48,
        }}>
          <p style={{ fontWeight: 700, color: "#f97316", marginBottom: 8, fontSize: 13, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
            Ringkasan Singkat
          </p>
          <p style={{ color: "#d1d5db", fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
            CekKontak adalah layanan web cek nomor HP via GetContact. Tidak perlu install, tidak perlu daftar.
            Hanya Rp 500 per cek via QRIS — atau gratis dengan kode promo. Anonim, aman, hasil instan.
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
          {FAQS.map((faq, i) => (
            <details
              key={i}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "20px 0",
              }}
            >
              <summary style={{
                cursor: "pointer",
                fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
                fontWeight: 700,
                fontSize: 15.5,
                color: "#fff",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
              }}>
                <span>{faq.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <p style={{
                color: "#9ca3af",
                fontSize: 14.5,
                lineHeight: 1.8,
                marginTop: 12,
                marginBottom: 0,
              }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" as const, marginTop: 64 }}>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Masih ada pertanyaan?</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/" style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 100,
              textDecoration: "none",
              fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
            }}>
              Coba CekKontak Sekarang
            </Link>
            <a href="mailto:support@cekkontak.online" style={{
              background: "rgba(255,255,255,0.06)",
              color: "#d1d5db",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 100,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "var(--font-syne, 'Plus Jakarta Sans'), sans-serif",
            }}>
              Hubungi Support
            </a>
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px",
        textAlign: "center",
        color: "#4b5563",
        fontSize: 12,
      }}>
        <p>© {new Date().getFullYear()} CekKontak ·{" "}
          <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privasi</Link>
          {" · "}
          <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat</Link>
          {" · "}
          <Link href="/faq" style={{ color: "#6b7280", textDecoration: "none" }}>FAQ</Link>
        </p>
      </footer>
    </div>
  );
}
