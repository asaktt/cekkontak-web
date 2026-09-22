import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — CekKontak",
  description: "Syarat dan Ketentuan penggunaan layanan CekKontak. Harap baca dengan seksama sebelum menggunakan layanan.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
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
        <span style={{ fontSize: 13, color: "#6b7280" }}>Syarat &amp; Ketentuan</span>
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
        }}>Syarat &amp; Ketentuan</h1>

        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 48 }}>
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 40 }}>
          {[
            {
              title: "1. Penerimaan Syarat",
              content: `Dengan mengakses atau menggunakan layanan CekKontak ("Layanan"), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari syarat ini, Anda tidak memiliki izin untuk mengakses Layanan. Layanan ini hanya tersedia untuk pengguna yang berusia 17 tahun ke atas.`,
            },
            {
              title: "2. Deskripsi Layanan",
              content: `CekKontak menyediakan layanan pengecekan informasi nomor telepon menggunakan data yang tersedia melalui layanan GetContact. Layanan ini memungkinkan pengguna untuk mengetahui nama dan label yang telah disimpan oleh pengguna lain untuk nomor telepon tertentu. CekKontak bertindak sebagai perantara antara pengguna dan database GetContact.`,
            },
            {
              title: "3. Penggunaan yang Diizinkan",
              content: `Anda boleh menggunakan Layanan ini hanya untuk tujuan yang sah dan sesuai dengan peraturan perundang-undangan yang berlaku di Indonesia. Penggunaan yang diizinkan meliputi: verifikasi identitas kontak bisnis, pemeriksaan nomor tidak dikenal, dan riset personal yang tidak merugikan pihak lain.`,
            },
            {
              title: "4. Larangan Penggunaan",
              content: `Anda dilarang menggunakan Layanan untuk: (a) melanggar hak privasi orang lain; (b) mengumpulkan data dalam jumlah besar secara otomatis (scraping); (c) melakukan stalking, pelecehan, atau intimidasi; (d) tujuan komersial tanpa izin tertulis dari kami; (e) aktivitas ilegal dalam bentuk apapun; (f) mendistribusikan ulang data yang diperoleh dari Layanan ini.`,
            },
            {
              title: "5. Pembayaran dan Pengembalian Dana",
              content: `Layanan ini menggunakan sistem pembayaran berbasis QRIS dengan tarif Rp 500 per pencarian. Pembayaran diproses melalui payment gateway berlisensi Bank Indonesia. Setelah pembayaran berhasil dan hasil pencarian ditampilkan, pengembalian dana tidak dapat dilakukan. Jika terjadi kegagalan teknis dari pihak kami, pengguna berhak mendapatkan penggantian akses.`,
            },
            {
              title: "6. Akurasi Data",
              content: `Data yang ditampilkan oleh CekKontak bersumber dari database GetContact dan akurasinya bergantung pada kontribusi pengguna GetContact secara global. CekKontak tidak memberikan jaminan atas keakuratan, kelengkapan, atau keterkinian data tersebut. Pengguna bertanggung jawab sepenuhnya atas interpretasi dan penggunaan data yang diperoleh.`,
            },
            {
              title: "7. Batasan Tanggung Jawab",
              content: `CekKontak tidak bertanggung jawab atas: kerugian langsung atau tidak langsung yang timbul dari penggunaan Layanan; ketidakakuratan atau ketidaklengkapan data yang ditampilkan; gangguan layanan akibat faktor eksternal; atau tindakan pengguna berdasarkan informasi yang diperoleh dari Layanan ini.`,
            },
            {
              title: "8. Kekayaan Intelektual",
              content: `Semua konten, desain, logo, merek dagang, dan kode sumber yang tersedia di CekKontak adalah milik CekKontak dan dilindungi oleh hukum kekayaan intelektual Indonesia. Pengguna dilarang mereproduksi, mendistribusikan, atau membuat karya turunan tanpa izin tertulis dari kami.`,
            },
            {
              title: "9. Perubahan Syarat",
              content: `Kami berhak untuk mengubah Syarat dan Ketentuan ini kapan saja. Perubahan akan berlaku segera setelah diterbitkan di halaman ini. Penggunaan Layanan yang berkelanjutan setelah perubahan diterbitkan merupakan penerimaan Anda terhadap syarat yang diperbarui. Kami akan berusaha memberikan pemberitahuan untuk perubahan signifikan.`,
            },
            {
              title: "10. Hukum yang Berlaku",
              content: `Syarat dan Ketentuan ini diatur oleh hukum Negara Republik Indonesia. Setiap sengketa yang timbul sehubungan dengan Syarat ini akan diselesaikan melalui mediasi terlebih dahulu, dan jika tidak berhasil, melalui Pengadilan Negeri yang berwenang di Indonesia.`,
            },
            {
              title: "11. Kontak",
              content: `Untuk pertanyaan mengenai Syarat dan Ketentuan ini, hubungi kami di: support@cekkontak.online`,
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
            Dengan menggunakan layanan CekKontak, Anda menyetujui Syarat &amp; Ketentuan ini.
            Lihat juga <Link href="/privacy" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>Kebijakan Privasi</Link> kami.
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
