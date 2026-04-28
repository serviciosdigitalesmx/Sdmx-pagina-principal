import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import type { Metadata } from 'next';
import { Inter, Orbitron, Rajdhani } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const rajdhani = Rajdhani({ 
  subsets: ['latin'], 
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600', '700'] 
});

export const metadata: Metadata = { 
  title: 'SDMX | Internal Suite',
  description: 'Sistema de Gestión Sr-Fix'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable}`}>
      <body className="antialiased bg-slate-950 text-slate-200">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
