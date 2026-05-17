import Link from 'next/link';

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Link href="/" className="inline-flex text-sm uppercase tracking-[0.35em] text-emerald-400">
              FIXI
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-300">{subtitle}</p>
            {footer}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
