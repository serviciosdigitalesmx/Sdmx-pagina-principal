import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDMX",
  description: "ERP de talleres con control SaaS multi-tenant"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
