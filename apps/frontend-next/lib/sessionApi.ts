import { getSupabaseClient } from "@/lib/supabase";

type ApiResult<T> = {
  success: boolean;
  data: T;
};

export async function fetchAuthedSessionApi<T>(path: string): Promise<T> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Usuario no autenticado");
  }

  const response = await fetch(`/api/${path.replace(/^\/+/, "")}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ApiResult<T>
    | { success?: boolean; error?: { message?: string } };

  if (!response.ok || payload.success === false) {
    const errorPayload = payload as { error?: { message?: string } };
    throw new Error(errorPayload?.error?.message || `Error consultando /api/${path}`);
  }

  return (payload as ApiResult<T>).data;
}
