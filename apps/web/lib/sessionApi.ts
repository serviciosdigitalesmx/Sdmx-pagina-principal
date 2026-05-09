import { apiClient } from "@/lib/apiClient";
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

export async function fetchAuthedSessionApi<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(`/${path.replace(/^\/+/, "")}`);

  if (!response.success || !response.data) {
    throw new Error(getApiErrorMessage(response.error, `Error consultando /api/${path}`));
  }

  return response.data;
}
