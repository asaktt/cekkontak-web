import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cekkontak.online"),
  title: "GetContact Tag Checker",
  description: "Cek tag dan profil nomor HP menggunakan GetContact. Masukkan nomor telepon dan temukan siapa yang menyimpannya.",
  keywords: ["getcontact", "cek nomor", "tag nomor hp", "siapa yang menyimpan nomor", "cekkontak"],
  openGraph: {
    title: "GetContact Tag Checker",
    description: "Cek tag dan profil nomor HP menggunakan GetContact",
    url: "https://cekkontak.online",
    siteName: "CekKontak",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GetContact Tag Checker",
    description: "Cek tag dan profil nomor HP menggunakan GetContact",
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
