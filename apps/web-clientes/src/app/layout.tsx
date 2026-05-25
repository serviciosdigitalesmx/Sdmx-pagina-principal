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
  title:
    process.env.NEXT_PUBLIC_CUSTOMER_META_TITLE ?? "FIXI | Portal del cliente",
  description:
    process.env.NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION ??
    "FIXI: portal para clientes de taller con seguimiento, soporte y notificaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.18),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111113_46%,#18181b_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
