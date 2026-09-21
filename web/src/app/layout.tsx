import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cekkontak.online"),
  title: "CekKontak — Cek Tag & Profil Nomor HP",
  description: "Cek tag dan profil nomor HP menggunakan GetContact. Masukkan nomor telepon dan temukan siapa yang menyimpannya.",
  keywords: ["getcontact", "cek nomor", "tag nomor hp", "siapa yang menyimpan nomor", "cekkontak"],
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
  openGraph: {
    title: "CekKontak — Cek Tag & Profil Nomor HP",
    description: "Cek tag dan profil nomor HP menggunakan GetContact",
    url: "https://cekkontak.online",
    siteName: "CekKontak",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "CekKontak Logo" }],
  },
  twitter: {
    card: "summary",
    title: "CekKontak — Cek Tag & Profil Nomor HP",
    description: "Cek tag dan profil nomor HP menggunakan GetContact",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://cekkontak.online",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
