import { apiClient } from "@/lib/apiClient";

export async function fetchAuthedSessionApi<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(`/${path.replace(/^\/+/, "")}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || `Error consultando /api/${path}`);
  }

  return response.data;
}
