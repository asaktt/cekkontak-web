import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ── Canonical URL ────────────────────────────────────────────────────────────
const BASE_URL = "https://cekkontak.online";
const SITE_NAME = "CekKontak";
const TITLE = "CekKontak — Cek Nama & Tag Nomor HP via GetContact | Gratis";
const DESCRIPTION =
  "Cek siapa yang menyimpan nomor HP kamu di GetContact. Temukan nama, label, dan reputasi nomor telepon secara instan — anonim, aman, hanya Rp 500. Coba gratis dengan kode promo.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    // Primary
    "getcontact",
    "cek nomor hp",
    "cek tag getcontact",
    "siapa yang menyimpan nomor saya",
    "cekkontak",
    // Long-tail
    "cara cek nama nomor di getcontact",
    "cek reputasi nomor hp",
    "nomor hp disimpan siapa",
    "lacak nomor hp",
    "cek kontak getcontact indonesia",
    "tag nomor hp getcontact",
    "getcontact web",
    "cek nomor spam",
    "nomor tidak dikenal",
    "siapa pemilik nomor ini",
    // Semantic
    "pengecekan nomor telepon",
    "lookup nomor hp indonesia",
    "getcontact api",
    "verifikasi nomor hp",
  ],
  authors: [{ name: SITE_NAME, url: BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  classification: "Technology/Utilities",
  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/logo.png",
        width: 1500,
        height: 600,
        alt: "CekKontak — Cek Nama & Tag Nomor HP via GetContact",
        type: "image/png",
      },
    ],
  },
  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
    site: "@cekkontak",
    creator: "@cekkontak",
  },
  // ── Canonical & Alternates ────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: {
      "id-ID": BASE_URL,
    },
  },
  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // ── Verification ──────────────────────────────────────────────────────────
  verification: {
    google: "4ElBBsUU8QNcKtmdjYlKOihcn-b_Fo7-LuwitmoA6-M",
  },
  // ── App & Misc ────────────────────────────────────────────────────────────
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
};

// ── JSON-LD Structured Data (multiple schemas) ─────────────────────────────
const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${BASE_URL}/#webapp`,
  "name": SITE_NAME,
  "url": BASE_URL,
  "description": DESCRIPTION,
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web Browser",
  "browserRequirements": "Requires JavaScript",
  "inLanguage": "id-ID",
  "offers": {
    "@type": "Offer",
    "price": "500",
    "priceCurrency": "IDR",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "description": "Cek satu nomor HP via QRIS — atau gratis dengan kode promo",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1240",
    "bestRating": "5",
    "worstRating": "1",
  },
  "featureList": [
    "Cek nama dan tag nomor HP via GetContact",
    "Pembayaran QRIS Rp 500",
    "Kode promo gratis",
    "Hasil instan dalam detik",
    "Pencarian anonim",
    "SSL terenkripsi",
  ],
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  "name": SITE_NAME,
  "url": BASE_URL,
  "logo": {
    "@type": "ImageObject",
    "url": `${BASE_URL}/logo.png`,
    "width": 1500,
    "height": 600,
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@cekkontak.online",
    "contactType": "customer support",
    "availableLanguage": "Indonesian",
  },
  "sameAs": [],
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  "url": BASE_URL,
  "name": SITE_NAME,
  "description": DESCRIPTION,
  "inLanguage": "id-ID",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Apa itu CekKontak?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CekKontak adalah layanan web yang memungkinkan kamu untuk mengecek nama dan tag/label yang disimpan pengguna GetContact untuk nomor HP tertentu. Hasil ditampilkan instan dan anonim.",
      },
    },
    {
      "@type": "Question",
      "name": "Bagaimana cara menggunakan CekKontak?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Masukkan nomor HP yang ingin dicek (format 08xx atau +628xx), lalu pilih metode akses: gunakan kode promo gratis atau bayar Rp 500 via QRIS (GoPay, OVO, DANA, ShopeePay). Hasil langsung tampil.",
      },
    },
    {
      "@type": "Question",
      "name": "Apakah pencarian nomor HP di CekKontak anonim?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ya. Pencarian di CekKontak sepenuhnya anonim. Pemilik nomor tidak akan diberitahu bahwa nomornya dicek.",
      },
    },
    {
      "@type": "Question",
      "name": "Berapa biaya cek nomor di CekKontak?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Hanya Rp 500 per pencarian via QRIS. Kamu juga bisa menggunakan kode promo untuk akses gratis.",
      },
    },
    {
      "@type": "Question",
      "name": "Metode pembayaran apa yang diterima?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CekKontak menerima semua metode QRIS termasuk GoPay, OVO, DANA, ShopeePay, LinkAja, dan semua mobile banking yang mendukung QRIS.",
      },
    },
    {
      "@type": "Question",
      "name": "Apakah CekKontak aman?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ya. CekKontak menggunakan enkripsi SSL dan pembayaran diproses via payment gateway berlisensi Bank Indonesia. Data tidak disimpan setelah sesi selesai.",
      },
    },
    {
      "@type": "Question",
      "name": "Apa perbedaan CekKontak dengan aplikasi GetContact?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GetContact adalah aplikasi mobile yang memerlukan instalasi dan akses kontak. CekKontak adalah layanan web yang lebih cepat dan tidak memerlukan instalasi — cukup buka browser, masukkan nomor, dan lihat hasilnya.",
      },
    },
  ],
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Beranda",
      "item": BASE_URL,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" dir="ltr">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>

        {/* JSON-LD — Multiple schemas for maximum coverage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />

        {/* Geographic targeting */}
        <meta name="geo.region" content="ID"/>
        <meta name="geo.country" content="ID"/>
        <meta name="language" content="Indonesian"/>
        <meta name="target" content="all"/>
        <meta name="audience" content="all"/>
        <meta name="coverage" content="Indonesia"/>
        <meta name="distribution" content="global"/>

        {/* GEO / AI crawler hints */}
        <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"/>
        <meta name="bingbot" content="index,follow"/>

        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#080808"/>
        <meta name="color-scheme" content="dark"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="CekKontak"/>

        {/* Additional SEO */}
        <meta name="rating" content="general"/>
        <meta name="revisit-after" content="7 days"/>
        <meta name="expires" content="never"/>
      </head>
      <body className={`${plusJakartaSans.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
