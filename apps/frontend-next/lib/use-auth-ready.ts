"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      const data = await apiClient.get("/auth/me");
      if (!mounted) return;
      setReady(Boolean(data.success && data.data));
    };

    void sync();

    return () => {
      mounted = false;
    };
  }, []);

  return ready;
}
