import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title:
    process.env.NEXT_PUBLIC_SAAS_META_TITLE ??
    "Plataforma SaaS white-label para talleres de reparación",
  description:
      process.env.NEXT_PUBLIC_SAAS_META_DESCRIPTION ??
    "SaaS multi-tenant para talleres de celulares, computadoras y electrónica con automatización y aislamiento por tenant.",
};

export const viewport = {
  themeColor: process.env.NEXT_PUBLIC_SAAS_THEME_COLOR ?? "#2c6e9f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
