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
    process.env.NEXT_PUBLIC_TENANT_META_TITLE ?? "Portal white-label del taller",
  description:
    process.env.NEXT_PUBLIC_TENANT_META_DESCRIPTION ??
    "Portal operativo white-label para talleres con soporte y experiencia configurable.",
};

export const viewport = {
  themeColor: process.env.NEXT_PUBLIC_TENANT_THEME_COLOR ?? "#2c6e9f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePrimary = process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#2c6e9f';
  const themeSecondary = process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#1f2937';
  const themeAccent = process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#5e9dc9';

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
      style={
        {
          '--tenant-primary': themePrimary,
          '--tenant-secondary': themeSecondary,
          '--tenant-accent': themeAccent,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col bg-[#f4f6f9] text-slate-800">{children}</body>
    </html>
  );
}
