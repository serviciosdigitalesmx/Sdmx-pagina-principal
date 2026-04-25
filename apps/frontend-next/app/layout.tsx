import './globals.css';
import type { Metadata } from 'next';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = { title: 'Servicios Digitales MX' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
