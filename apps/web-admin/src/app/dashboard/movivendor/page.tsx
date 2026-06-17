"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Banknote, ClipboardList, Gift, RefreshCw, ShieldAlert, Sparkles, Ticket, Wallet, RadioTower } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { useTenantIdentity } from "@/providers/TenantIdentityProvider";
import type { MovivendorAccount, MovivendorActivationRequest, MovivendorTransaction } from "@/types";

type MovivendorStatusResponse = {
  success: true;
  data: {
    activationRequest: MovivendorActivationRequest | null;
    account: MovivendorAccount | null;
  };
};

type MovivendorRequestsResponse = {
  success: true;
  data: MovivendorActivationRequest[];
};

type MovivendorTransactionsResponse = {
  success: true;
  data: MovivendorTransaction[];
};

type MovivendorProductsResponse = {
  success: true;
  data: Array<Record<string, unknown>>;
};

type MovivendorBalanceResponse = {
  success: true;
  data: Record<string, unknown>;
};

const initialActivation = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
};

const initialAccount = {
  movivendorUser: "",
  movivendorPassword: "",
  movivendorIdent: "",
  movivendorTerminal: "",
};

function statusTone(status?: string | null) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "active" || normalized === "approved") return "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
  if (normalized === "reviewing" || normalized === "checking" || normalized === "pending") return "text-amber-300 border-amber-500/20 bg-amber-500/10";
  if (normalized === "rejected" || normalized === "suspended" || normalized === "credentials_error" || normalized === "failed") return "text-rose-300 border-rose-500/20 bg-rose-500/10";
  return "text-sky-300 border-sky-500/20 bg-sky-500/10";
}

export default function MovivendorPage() {
  const { identity } = useTenantIdentity();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<MovivendorStatusResponse["data"] | null>(null);
  const [requests, setRequests] = useState<MovivendorActivationRequest[]>([]);
  const [transactions, setTransactions] = useState<MovivendorTransaction[]>([]);
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([]);
  const [balance, setBalance] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activation, setActivation] = useState(initialActivation);
  const [account, setAccount] = useState(initialAccount);
  const [sale, setSale] = useState({ externalId: "", product: "", subprod: "", destination: "", amount: "" });

  const isOwner = identity?.role === "owner";
  const isManager = identity?.role === "manager";
  const canAdminister = isOwner || isManager;

  const load = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [statusRes, txRes, productRes, balanceRes] = await Promise.all([
        apiClient.get<MovivendorStatusResponse>("/movivendor/status", getApiOptions()),
        apiClient.get<MovivendorTransactionsResponse>("/movivendor/transactions", getApiOptions()).catch(() => ({ success: true, data: [] })),
        apiClient.get<MovivendorProductsResponse>("/movivendor/products", getApiOptions()).catch(() => ({ success: true, data: [] })),
        apiClient.get<MovivendorBalanceResponse>("/movivendor/balance", getApiOptions()).catch(() => ({ success: true, data: {} })),
      ]);

      setStatus(statusRes.data);
      setTransactions(txRes.data ?? []);
      setProducts(productRes.data ?? []);
      setBalance(balanceRes.data ?? null);

      if (isOwner) {
        const reqRes = await apiClient.get<MovivendorRequestsResponse>("/movivendor/activation-requests");
        setRequests(reqRes.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar Movivendor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const tenantStateLabel = useMemo(() => {
    const statusValue = status?.account?.status ?? status?.activationRequest?.status ?? "inactive";
    return statusValue;
  }, [status]);

  const requestActivation = async () => {
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post("/movivendor/activation-requests", {
        businessName: activation.businessName,
        ownerName: activation.ownerName,
        email: activation.email,
        phone: activation.phone,
      }, getApiOptions());
      setSuccess("Solicitud de activación enviada.");
      setActivation(initialActivation);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud");
    }
  };

  const saveAccount = async () => {
    setError(null);
    setSuccess(null);
    try {
      const result = await apiClient.put<MovivendorStatusResponse>("/movivendor/account", {
        movivendorUser: account.movivendorUser,
        movivendorPassword: account.movivendorPassword,
        movivendorIdent: account.movivendorIdent,
        movivendorTerminal: account.movivendorTerminal,
      }, getApiOptions());
      setStatus(result.data);
      setSuccess("Credenciales validadas y guardadas.");
      setAccount(initialAccount);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar las credenciales");
    }
  };

  const runSale = async (endpoint: "/movivendor/sales" | "/movivendor/services") => {
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(endpoint, {
        externalId: sale.externalId,
        product: sale.product,
        subprod: sale.subprod || null,
        destination: sale.destination,
        amount: Number(sale.amount),
        paymentMethod: "cash",
      }, getApiOptions());
      setSuccess("Operación enviada a Movivendor.");
      setSale({ externalId: "", product: "", subprod: "", destination: "", amount: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar la operación");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(9,12,20,0.98),rgba(7,10,18,0.92))] p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-400/70">Movivendor</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">Recargas, servicios y gift cards</h1>
            <p className="mt-2 text-sm text-slate-400">Flujo backend-only con activación administrativa, credenciales cifradas e idempotencia por `external_id`.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Recargar
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 ${statusTone(tenantStateLabel)}`}>Estado: {tenantStateLabel}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-200">Backend only</span>
          <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-200">Tenant ID: {identity?.tenantSlug}</span>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{success}</div> : null}

      {!status?.account?.status || status.account.status !== "active" ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-sky-400" />
              <h2 className="text-xl font-semibold text-slate-50">Activa Recargas, Servicios y Gift Cards para tu negocio</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-400">Solicita activación y un propietario de Fixi podrá completar el alta administrativa en el portal de distribuidor Movivendor.</p>
            <div className="mt-5 space-y-4">
              <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Nombre del negocio" value={activation.businessName} onChange={(e) => setActivation((c) => ({ ...c, businessName: e.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Nombre del propietario" value={activation.ownerName} onChange={(e) => setActivation((c) => ({ ...c, ownerName: e.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Correo" value={activation.email} onChange={(e) => setActivation((c) => ({ ...c, email: e.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Teléfono" value={activation.phone} onChange={(e) => setActivation((c) => ({ ...c, phone: e.target.value }))} />
              <div className="flex flex-wrap gap-3">
                <button onClick={requestActivation} className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">Solicitar Activación</button>
                <button className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-100">Más información</button>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>NO se muestra crear cuenta Movivendor.</li>
                <li>NO se expone usuario/password al frontend.</li>
                <li>La cuenta se valida backend-only al guardar credenciales.</li>
              </ul>
            </div>
          </div>

          {canAdminister ? (
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-300" />
                <h2 className="text-xl font-semibold text-slate-50">Configuración interna</h2>
              </div>
              <p className="mt-3 text-sm text-slate-400">El backend cifrará la contraseña y validará `POST /v1/generate/token` contra Movivendor.</p>
              <div className="mt-5 space-y-4">
                <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Usuario Movivendor" value={account.movivendorUser} onChange={(e) => setAccount((c) => ({ ...c, movivendorUser: e.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Contraseña Movivendor" type="password" value={account.movivendorPassword} onChange={(e) => setAccount((c) => ({ ...c, movivendorPassword: e.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Identificador" value={account.movivendorIdent} onChange={(e) => setAccount((c) => ({ ...c, movivendorIdent: e.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Terminal" value={account.movivendorTerminal} onChange={(e) => setAccount((c) => ({ ...c, movivendorTerminal: e.target.value }))} />
                <button onClick={saveAccount} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Guardar y validar</button>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-sky-400" />
              <h2 className="text-xl font-semibold text-slate-50">Nueva Venta</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="external_id" value={sale.externalId} onChange={(e) => setSale((c) => ({ ...c, externalId: e.target.value }))} />
              <input className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Producto" value={sale.product} onChange={(e) => setSale((c) => ({ ...c, product: e.target.value }))} />
              <input className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Subproducto" value={sale.subprod} onChange={(e) => setSale((c) => ({ ...c, subprod: e.target.value }))} />
              <input className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100" placeholder="Destino" value={sale.destination} onChange={(e) => setSale((c) => ({ ...c, destination: e.target.value }))} />
              <input className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-100 sm:col-span-2" placeholder="Monto" value={sale.amount} onChange={(e) => setSale((c) => ({ ...c, amount: e.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => void runSale("/movivendor/sales")} className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">Ejecutar Venta</button>
              <button onClick={() => void runSale("/movivendor/services")} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Pago de Servicios</button>
            </div>
            <p className="text-xs text-slate-500">Si Movivendor responde 504, el backend marca `checking` y hace polling a `POST /v1/check/tx`.</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-emerald-300" />
                <h3 className="text-lg font-semibold text-slate-50">Saldo</h3>
              </div>
              <pre className="mt-4 overflow-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">{JSON.stringify(balance, null, 2)}</pre>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex items-center gap-3">
                <RadioTower className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-semibold text-slate-50">Productos</h3>
              </div>
              <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">{JSON.stringify(products.slice(0, 10), null, 2)}</pre>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-50">Historial de transacciones</h2>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">External ID</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">PIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((row) => (
                <tr key={row.id} className="text-slate-300">
                  <td className="px-4 py-3">{row.external_id}</td>
                  <td className="px-4 py-3">{row.product}</td>
                  <td className="px-4 py-3">{row.destination}</td>
                  <td className="px-4 py-3">{row.amount}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.pin || "-"}</td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>No hay transacciones aún.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isOwner ? (
        <section className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold text-slate-50">Admin → Movivendor → Solicitudes</h2>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {requests.map((request) => (
                  <tr key={request.id} className="text-slate-300">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{request.business_name}</div>
                      <div className="text-xs text-slate-500">{request.tenant_slug}</div>
                    </td>
                    <td className="px-4 py-3">{new Date(request.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{request.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {['reviewing', 'approved', 'rejected', 'active', 'suspended'].map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={async () => {
                              await apiClient.patch(`/movivendor/activation-requests/${request.id}`, { status: nextStatus, reviewNotes: null });
                              await load();
                            }}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs"
                          >
                            {nextStatus}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={4}>No hay solicitudes pendientes.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
