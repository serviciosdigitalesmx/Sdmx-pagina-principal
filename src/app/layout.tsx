import type { Metadata } from 'next';
import './globals.css';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'New Project 21';

export const metadata: Metadata = {
  title: appName,
  description: 'Production-ready SaaS foundation with Next.js, Render API, and Supabase.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
