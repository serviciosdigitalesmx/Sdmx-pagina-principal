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
  title: "FIXI | Plataforma SaaS para talleres",
  description:
    process.env.NEXT_PUBLIC_SAAS_META_DESCRIPTION ??
    "FIXI: plataforma para talleres con marca blanca, tracking y control.",
};

export const viewport = {
  themeColor: process.env.NEXT_PUBLIC_SAAS_THEME_COLOR ?? "#111827",
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
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.18),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111113_46%,#18181b_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
