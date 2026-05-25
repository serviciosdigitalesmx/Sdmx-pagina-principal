"use client";

import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_38%,#ffffff_100%)] px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Recuperación</p>
        <h1 className="text-4xl font-semibold tracking-tight">Revisa tu correo</h1>
        <p className="text-lg leading-8 text-slate-600">
          Si el correo existe en el sistema, te mandamos un enlace para crear una nueva contraseña.
        </p>
        <Link
          href="/login"
          className="w-fit rounded-full bg-[#334155] px-5 py-3 font-semibold text-white transition hover:bg-[#1f2937]"
        >
          Volver al login
        </Link>
      </section>
    </main>
  );
}
