"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tenant_name: tenantName
        }
      }
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session?.access_token) {
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
      const initRes = await fetch(`${apiBaseUrl}/api/setup/init`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json"
        }
      });
      if (!initRes.ok) throw new Error("Setup failed");
      router.push("/dashboard");
      return;
    }

    setInfo("Revisa tu correo para confirmar tu cuenta y luego iniciar sesión.");
  }

  async function continueWithGoogle() {
    setError(null);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) setError(error.message);
  }

  return (
    <main className="shell">
      <form onSubmit={onSubmit} className="card stack" style={{ maxWidth: 480 }}>
        <h1>Registro</h1>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" />
        <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Nombre del negocio" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        {error ? <p>{error}</p> : null}
        {info ? <p>{info}</p> : null}
        <button type="submit">Crear cuenta</button>
        <button type="button" onClick={continueWithGoogle}>Continuar con Google</button>
      </form>
    </main>
  );
}
