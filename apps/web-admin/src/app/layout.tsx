import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sr. Fix Admin",
  description: "Dashboard multi-tenant de administración para Sr. Fix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePrimary = process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#22d3ee';
  const themeSecondary = process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#0f172a';
  const themeAccent = process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#34d399';

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={
        {
          '--tenant-primary': themePrimary,
          '--tenant-secondary': themeSecondary,
          '--tenant-accent': themeAccent,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col bg-slate-950">{children}</body>
    </html>
  );
}
