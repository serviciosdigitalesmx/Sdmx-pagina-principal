"use client";

import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#0f172a_38%,#f8fafc_38%,#f8fafc_100%)] px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Recuperación</p>
        <h1 className="text-4xl font-semibold tracking-tight">Revisa tu correo</h1>
        <p className="text-lg leading-8 text-slate-600">
          Si el correo existe en el sistema, te mandamos un enlace para crear una nueva contraseña.
        </p>
        <Link
          href="/login"
          className="w-fit rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Volver al login
        </Link>
      </section>
    </main>
  );
}
