import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — CekKontak",
  description: "Kebijakan Privasi CekKontak: bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "var(--font-dm-sans, 'DM Sans'), system-ui, sans-serif",
    }}>
      {/* Simple nav */}
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
          fontFamily: "var(--font-syne, 'Syne'), sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "#fff",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          ← CekKontak
        </Link>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Kebijakan Privasi</span>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.22)",
          borderRadius: 100,
          padding: "4px 14px",
          fontFamily: "var(--font-syne, 'Syne'), sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: "#f97316",
          letterSpacing: "0.8px",
          textTransform: "uppercase" as const,
          marginBottom: 16,
        }}>Legal</div>

        <h1 style={{
          fontFamily: "var(--font-syne, 'Syne'), sans-serif",
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-2px",
          marginBottom: 12,
          lineHeight: 1.05,
        }}>Kebijakan Privasi</h1>

        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 48 }}>
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 40 }}>
          {[
            {
              title: "1. Informasi yang Kami Kumpulkan",
              content: `Kami mengumpulkan informasi yang Anda berikan secara langsung, yaitu nomor telepon yang Anda masukkan untuk dicek. Kami juga mengumpulkan data teknis seperti alamat IP, jenis browser, dan waktu akses untuk keperluan keamanan dan peningkatan layanan. Kami tidak mengumpulkan data pribadi seperti nama, alamat email, atau informasi kartu kredit tanpa persetujuan eksplisit Anda.`,
            },
            {
              title: "2. Cara Kami Menggunakan Informasi",
              content: `Nomor telepon yang Anda masukkan digunakan semata-mata untuk mengambil data dari layanan GetContact dan menampilkan hasilnya kepada Anda. Data ini tidak kami simpan secara permanen setelah sesi selesai. Informasi teknis digunakan untuk mencegah penyalahgunaan, mendeteksi aktivitas mencurigakan, dan meningkatkan kualitas layanan.`,
            },
            {
              title: "3. Berbagi Data dengan Pihak Ketiga",
              content: `Kami tidak menjual, memperdagangkan, atau mentransfer informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali: (a) untuk memproses pembayaran melalui payment gateway berlisensi Bank Indonesia; (b) jika diwajibkan oleh hukum atau perintah pengadilan; (c) untuk melindungi hak, properti, atau keselamatan kami atau pengguna lain.`,
            },
            {
              title: "4. Keamanan Data",
              content: `Kami menggunakan enkripsi SSL/TLS untuk semua transmisi data. Pembayaran diproses melalui payment gateway yang memenuhi standar PCI-DSS. Kami secara rutin meninjau dan memperbarui langkah-langkah keamanan kami untuk melindungi data Anda dari akses tidak sah, pengubahan, pengungkapan, atau penghancuran.`,
            },
            {
              title: "5. Cookie dan Teknologi Pelacakan",
              content: `Kami menggunakan cookie sesi yang diperlukan untuk fungsi dasar layanan. Kami tidak menggunakan cookie pelacakan pihak ketiga untuk tujuan iklan. Anda dapat mengatur browser Anda untuk menolak cookie, namun hal ini dapat mempengaruhi fungsionalitas layanan.`,
            },
            {
              title: "6. Hak Pengguna",
              content: `Anda berhak untuk: meminta informasi tentang data yang kami miliki tentang Anda; meminta penghapusan data yang terkait dengan Anda; mengajukan keberatan atas pemrosesan data Anda; mengajukan keluhan kepada otoritas perlindungan data yang relevan.`,
            },
            {
              title: "7. Perubahan Kebijakan",
              content: `Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan melalui halaman ini dengan tanggal pembaruan yang direvisi. Penggunaan layanan Anda yang berkelanjutan setelah perubahan tersebut merupakan penerimaan Anda terhadap kebijakan yang diperbarui.`,
            },
            {
              title: "8. Kontak",
              content: `Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di: support@cekkontak.online`,
            },
          ].map((section) => (
            <section key={section.title}>
              <h2 style={{
                fontFamily: "var(--font-syne, 'Syne'), sans-serif",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 12,
                letterSpacing: "-0.3px",
                color: "#fff",
              }}>{section.title}</h2>
              <p style={{
                color: "#9ca3af",
                lineHeight: 1.8,
                fontSize: 14.5,
              }}>{section.content}</p>
            </section>
          ))}
        </div>

        <div style={{
          marginTop: 56,
          padding: "20px 24px",
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.15)",
          borderRadius: 14,
        }}>
          <p style={{ color: "#9ca3af", fontSize: 13.5, lineHeight: 1.7 }}>
            Dengan menggunakan layanan CekKontak, Anda menyetujui Kebijakan Privasi ini.
            Lihat juga <Link href="/terms" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>Syarat &amp; Ketentuan</Link> kami.
          </p>
        </div>
      </main>

      {/* Simple footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px",
        textAlign: "center",
        color: "#4b5563",
        fontSize: 12,
      }}>
        <p>© {new Date().getFullYear()} CekKontak. Hak cipta dilindungi. ·{" "}
          <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privasi</Link>
          {" · "}
          <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat</Link>
        </p>
      </footer>
    </div>
  );
}
