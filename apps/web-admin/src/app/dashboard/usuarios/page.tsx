"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  activo: boolean;
  ultimo_acceso: string | null;
  last_login_at: string | null;
};

type UserHistoryRow = {
  id: string;
  folio?: string | null;
  status?: string | null;
  reference?: string | null;
  payment_terms?: string | null;
  expected_date?: string | null;
  total?: number | null;
  created_at?: string | null;
};

type InviteFormState = {
  name: string;
  email: string;
  role: string;
  sucursalId: string;
};

const INITIAL_INVITE: InviteFormState = { name: "", email: "", role: "tecnico", sucursalId: "" };

function formatDate(value: string | null | undefined) {
  if (!value) return "No disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : date.toLocaleString("es-MX");
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: "Admin",
    operador: "Operador",
    tecnico: "Técnico",
    cliente: "Cliente",
    compras: "Compras",
    owner: "Owner",
    manager: "Manager",
    technician: "Technician",
  };
  return map[role] ?? role;
}

export default function UsuariosPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState<InviteFormState>(INITIAL_INVITE);
  const [saving, setSaving] = useState(false);
  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const [historyRows, setHistoryRows] = useState<UserHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.activo).length;
    const latestLogin = users
      .map((user) => user.ultimo_acceso ?? user.last_login_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    return [
      { label: "Usuarios", value: String(total || users.length), helper: "Total en el tenant." },
      { label: "Activos", value: String(activeUsers), helper: "Usuarios habilitados." },
      { label: "Último acceso", value: latestLogin ? formatDate(latestLogin) : "No disponible", helper: "Último login detectado." },
    ];
  }, [total, users]);

  async function loadUsers(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const result = await fixService.getUsers({
        page: nextPage,
        pageSize,
        q: query.trim() || undefined,
        role: roleFilter || undefined,
        status,
      });
      setUsers(result.data as UserRow[]);
      setPage(result.page);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, status]);

  useEffect(() => {
    if (!historyUser) {
      setHistoryRows([]);
      setHistoryError("");
      return;
    }

    const activeHistoryUser = historyUser;
    let cancelled = false;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const data = await fixService.getUserPurchaseOrders(activeHistoryUser.id);
        if (!cancelled) {
          setHistoryRows(data as UserHistoryRow[]);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err instanceof Error ? err.message : "No se pudo cargar el historial");
          setHistoryRows([]);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [historyUser]);

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await fixService.inviteUser({
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
        sucursalId: invite.sucursalId.trim() ? invite.sucursalId.trim() : undefined,
      });
      setShowInvite(false);
      setInvite(INITIAL_INVITE);
      await loadUsers(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo invitar al usuario");
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(user: UserRow, nextRole: string) {
    if (!window.confirm(`Cambiar el rol de ${user.name} a ${roleLabel(nextRole)}.`)) return;
    try {
      setError("");
      await fixService.updateUserRole(user.id, nextRole);
      await loadUsers(page);
      if (historyUser?.id === user.id) setHistoryUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el rol");
    }
  }

  async function deactivateUser(user: UserRow) {
    if (!window.confirm(`Desactivar a ${user.name}?`)) return;
    try {
      setError("");
      await fixService.deactivateUser(user.id);
      await loadUsers(page);
      if (historyUser?.id === user.id) setHistoryUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el usuario");
    }
  }

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Usuarios y roles"
        subtitle={`Administración real del tenant ${auth.tenantSlug || auth.tenantId}. Invitaciones, roles y actividad.`}
        icon="fas fa-users"
        actionLabel="Invitar usuario"
        onAction={() => setShowInvite(true)}
        secondaryActionLabel="Refrescar"
        secondaryOnAction={() => void loadUsers(page)}
        tertiaryActionLabel={historyUser ? "Cerrar historial" : "Ver historial"}
        tertiaryOnAction={() => (historyUser ? setHistoryUser(null) : setError("Selecciona un usuario para ver historial"))}
        stats={stats}
        loading={loading || historyLoading}
        columns={[]}
        rows={[]}
        emptyTitle=""
        emptyCopy=""
        showTable={false}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-amber-100/60">Buscar</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o correo" className="input" />
            </label>
            <label>
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-amber-100/60">Estado</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="input">
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-amber-100/60">Rol</span>
              <input value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} placeholder="owner, manager..." className="input" />
            </label>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Último acceso</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.length > 0 ? users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{user.name}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{roleLabel(user.role)}</td>
                    <td className="px-4 py-3 text-zinc-300">{user.activo ? "Activo" : "Inactivo"}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatDate(user.ultimo_acceso ?? user.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setHistoryUser(user)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">Historial</button>
                        <button type="button" onClick={() => void changeRole(user, user.role === "owner" ? "manager" : "owner")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">Cambiar rol</button>
                        <button type="button" onClick={() => void deactivateUser(user)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">Desactivar</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500">
                      Sin usuarios visibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {historyUser ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <h2 className="text-base font-semibold text-zinc-50">Historial de {historyUser.name}</h2>
              {historyError ? <p className="mt-2 text-sm text-red-300">{historyError}</p> : null}
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-zinc-300">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Referencia</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {historyRows.length > 0 ? historyRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-zinc-300">{row.folio ?? row.id}</td>
                        <td className="px-4 py-3 text-zinc-300">{row.status ?? "N/A"}</td>
                        <td className="px-4 py-3 text-zinc-300">{row.reference ?? "N/A"}</td>
                        <td className="px-4 py-3 text-zinc-300">{formatDate(row.created_at)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-500">
                          Sin historial disponible.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
            <span>Mostrando {users.length} de {total}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => void loadUsers(Math.max(1, page - 1))} className="rounded-full border border-white/10 px-3 py-2 disabled:opacity-50">Anterior</button>
              <button type="button" disabled={!hasMore} onClick={() => void loadUsers(page + 1)} className="rounded-full border border-white/10 px-3 py-2 disabled:opacity-50">Siguiente</button>
            </div>
          </div>

          {showInvite ? (
            <form onSubmit={submitInvite} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-50">Invitar usuario real</h2>
                <button type="button" onClick={() => setShowInvite(false)} className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-200">Cerrar</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={invite.name} onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="input" />
                <input value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} placeholder="Correo" className="input" />
                <input value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))} placeholder="Rol" className="input" />
                <input value={invite.sucursalId} onChange={(event) => setInvite((current) => ({ ...current, sucursalId: event.target.value }))} placeholder="Sucursal" className="input" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="submit" disabled={saving} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60">
                  {saving ? "Enviando…" : "Enviar invitación"}
                </button>
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
              </div>
            </form>
          ) : null}
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
