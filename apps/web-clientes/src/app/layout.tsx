import type { Metadata } from "next";
import "./globals.css";

function resolveMetadataBase() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "https://clientes.serviciosdigitalesmx.online";
  if (!raw) return undefined;
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(normalized);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  title:
    process.env.NEXT_PUBLIC_CUSTOMER_META_TITLE ??
    "Servicios Digitales MX | Portal del cliente",
  description:
    process.env.NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION ??
    "Servicios Digitales MX: portal para clientes de taller con seguimiento, soporte y notificaciones.",
  metadataBase: resolveMetadataBase(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.18),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111113_46%,#18181b_100%)] text-zinc-100">{children}</body>
    </html>
  );
}
