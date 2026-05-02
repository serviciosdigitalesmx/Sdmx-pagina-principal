"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setReady(Boolean(data.session?.access_token));
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return ready;
}
