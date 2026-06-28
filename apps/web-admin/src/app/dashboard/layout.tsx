'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { AppShell, ShellContent } from '@/components/base/app-shell';
import { LoadingState, ErrorState } from '@/components/base/states';
import { isAuthenticated } from '@/lib/auth';
import { getCurrentSession } from '@/lib/session';
import { TenantIdentityProvider } from '@/providers/TenantIdentityProvider';
import { ModuleRouteGuard } from '@/components/guard/module-route-guard';
import { BillingExpiredScreen } from '@/components/billing/billing-expired-screen';
import { isBillingExpired, onBillingExpired } from '@/lib/billing-expired';

function getSessionUser() {
  const session = getCurrentSession();

  if (!session) return null;

  return {
    id: session.userId,
    email: session.email,
    name: session.email || 'Usuario activo',
    role: session.role as any,
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    sucursalId: session.branchId,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(getSessionUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [billingExpired, setBillingExpired] = useState(isBillingExpired());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      setAuthError('Necesitas iniciar sesión para acceder al panel.');
    } else {
      setUser(getSessionUser());
      setAuthError(null);
    }
  }, [router, pathname]);

  useEffect(() => onBillingExpired(setBillingExpired), []);

  if (billingExpired) {
    return <BillingExpiredScreen />;
  }

  if (!user) {
    return authError ? (
      <AppShell>
        <ShellContent className="flex min-h-screen items-center justify-center">
          <ErrorState message={authError} />
        </ShellContent>
      </AppShell>
    ) : (
      <AppShell>
        <ShellContent className="flex min-h-screen items-center justify-center">
          <LoadingState label="Cargando sesión..." />
        </ShellContent>
      </AppShell>
    );
  }

  return (
    <TenantIdentityProvider>
      <AppShell>
        <div className="flex min-h-screen">
          <Sidebar mobileOpen={menuOpen} onMobileOpenChange={setMenuOpen} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header user={user} onMenuClick={() => setMenuOpen(true)} />
            <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="mx-auto w-full max-w-[1720px]">
                <ModuleRouteGuard>{children}</ModuleRouteGuard>
              </div>
            </main>
          </div>
        </div>
      </AppShell>
    </TenantIdentityProvider>
  );
}
