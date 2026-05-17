import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export async function signUpWithEmail({
  fullName,
  email,
  password
}: {
  fullName: string;
  email: string;
  password: string;
}) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
}

export async function signInWithEmail({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/login`
    : undefined;

  return supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}
