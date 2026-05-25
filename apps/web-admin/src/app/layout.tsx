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
    process.env.NEXT_PUBLIC_TENANT_META_TITLE ?? "FIXIE | Panel del taller",
  description:
    process.env.NEXT_PUBLIC_TENANT_META_DESCRIPTION ??
    "FIXIE: panel white-label para talleres con soporte y experiencia personalizada.",
};

export const viewport = {
  themeColor: process.env.NEXT_PUBLIC_TENANT_THEME_COLOR ?? "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePrimary = process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#0ea5e9';
  const themeSecondary = process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#0f172a';
  const themeAccent = process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#f97316';

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
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
