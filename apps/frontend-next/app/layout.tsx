import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700']
});

export const metadata: Metadata = { 
  title: 'Fixi | Premium SaaS',
  description: 'Sistema de Gestión Fixi'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable}`}>
      <body className="antialiased bg-background text-textMain font-sans selection:bg-primary/30">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
