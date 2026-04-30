'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const fullName = user.user_metadata?.full_name || user.email || 'Usuario';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
      <p>Tu dashboard ha sido actualizado con guard de carga.</p>
      <p>Si tenías contenido adicional, revísalo en el backup: {DASHBOARD_FILE}.backup</p>
    </div>
  );
}
