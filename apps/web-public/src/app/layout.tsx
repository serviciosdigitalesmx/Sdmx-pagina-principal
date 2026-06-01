import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { requireEnv } from "@white-label/config";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: requireEnv("NEXT_PUBLIC_SAAS_BRAND_NAME"),
  description: requireEnv("NEXT_PUBLIC_SAAS_META_DESCRIPTION"),
};

export const viewport = {
  themeColor: requireEnv("NEXT_PUBLIC_SAAS_THEME_COLOR"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.14),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(251,191,36,0.08),_transparent_24%),linear-gradient(180deg,#050505_0%,#0f0f10_46%,#141210_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
