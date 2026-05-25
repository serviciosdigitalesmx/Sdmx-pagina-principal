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
    process.env.NEXT_PUBLIC_TENANT_META_TITLE ?? "FIXI | Panel del taller",
  description:
    process.env.NEXT_PUBLIC_TENANT_META_DESCRIPTION ??
    "FIXI: panel white-label para talleres con soporte y experiencia personalizada.",
};

export const viewport = {
  themeColor: process.env.NEXT_PUBLIC_TENANT_THEME_COLOR ?? "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePrimary = process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#111827';
  const themeSecondary = process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#09090b';
  const themeAccent = process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#6b7280';

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
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.16),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111113_46%,#18181b_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
