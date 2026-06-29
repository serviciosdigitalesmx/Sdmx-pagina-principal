"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Shield, UserX, History } from "lucide-react";
import { Badge, SurfaceCard } from "@white-label/ui";
import { usersService } from "@/services/users/usersService";
import { getActiveSucursalId } from "@/lib/tenant";
import type { Sucursal } from "@/types";

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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState<InviteFormState>(INITIAL_INVITE);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [saving, setSaving] = useState(false);
  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const [historyRows, setHistoryRows] = useState<UserHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const result = await usersService.getUsers({
        page: 1,
        pageSize: 50,
        q: query.trim() || undefined,
        role: roleFilter || undefined,
        status,
      });
      setUsers(result.data as UserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [query, roleFilter, status]);

  useEffect(() => {
    let cancelled = false;

    async function loadSucursales() {
      try {
        const rows = await usersService.getSucursales();
        if (!cancelled) setSucursales(rows as unknown as Sucursal[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar las sucursales");
        }
      }
    }

    void loadSucursales();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!historyUser) {
      setHistoryRows([]);
      return;
    }

    const activeHistoryUser = historyUser;
    let cancelled = false;
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const data = await usersService.getUserPurchaseOrders(activeHistoryUser.id);
        if (!cancelled) setHistoryRows(data as UserHistoryRow[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
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
      await usersService.inviteUser({
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
        sucursalId: invite.sucursalId.trim() ? invite.sucursalId.trim() : undefined,
      });
      setShowInvite(false);
      setInvite(INITIAL_INVITE);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo invitar al usuario");
    } finally {
      setSaving(false);
    }
  }

  function openInviteForm() {
    const activeSucursalId = getActiveSucursalId();
    const validActiveSucursal = sucursales.some((sucursal) => sucursal.id === activeSucursalId);
    setInvite({
      ...INITIAL_INVITE,
      sucursalId: validActiveSucursal && activeSucursalId ? activeSucursalId : "",
    });
    setShowInvite(true);
  }

  async function changeRole(user: UserRow, nextRole: string) {
    if (!window.confirm(`Cambiar el rol de ${user.name} a ${roleLabel(nextRole)}.`)) return;
    try {
      setError("");
      await usersService.updateUserRole(user.id, nextRole);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el rol");
    }
  }

  async function deactivateUser(user: UserRow) {
    if (!window.confirm(`Desactivar a ${user.name}?`)) return;
    try {
      setError("");
      await usersService.deactivateUser(user.id);
      await loadUsers();
      if (historyUser?.id === user.id) setHistoryUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el usuario");
    }
  }

  const activeUsers = useMemo(() => users.filter((user) => user.activo).length, [users]);

  if (loading && users.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-400">{users.length} visibles · {activeUsers} activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadUsers()} className="btn-outline inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button onClick={() => showInvite ? setShowInvite(false) : openInviteForm()} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invitar usuario
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <SurfaceCard elevated className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-9" placeholder="Buscar nombre o correo..." />
          </div>
        </SurfaceCard>
        <SurfaceCard elevated className="p-4">
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="input">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </SurfaceCard>
        <SurfaceCard elevated className="p-4">
          <input value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="input" placeholder="Filtrar por rol..." />
        </SurfaceCard>
        <SurfaceCard elevated className="p-4 text-center">
          <Shield className="mx-auto h-5 w-5 text-sky-300" />
          <div className="mt-3 text-3xl font-bold text-slate-50">{activeUsers}</div>
          <div className="text-xs text-slate-400">Usuarios activos</div>
        </SurfaceCard>
      </div>

      {showInvite ? (
        <SurfaceCard elevated className="space-y-4 p-4">
          <form onSubmit={submitInvite} className="space-y-4">
          <div className="text-lg font-semibold text-slate-50">Invitar usuario</div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={invite.name} onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))} className="input" placeholder="Nombre" required />
            <input value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} className="input" placeholder="Correo" type="email" required />
            <select value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))} className="input">
              <option value="tecnico">Técnico</option>
              <option value="operador">Operador</option>
              <option value="compras">Compras</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
            <select value={invite.sucursalId} onChange={(event) => setInvite((current) => ({ ...current, sucursalId: event.target.value }))} className="input">
              <option value="">Todas las sucursales</option>
              {sucursales.filter((sucursal) => sucursal.is_active).map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.name}{sucursal.code ? ` (${sucursal.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Enviando..." : "Enviar invitación"}</button>
            <button type="button" className="btn-outline" onClick={() => setShowInvite(false)}>Cancelar</button>
          </div>
          </form>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <SurfaceCard elevated className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Último acceso</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="primary">{roleLabel(user.role)}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={user.activo ? "success" : "danger"}>{user.activo ? "Activo" : "Inactivo"}</Badge></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(user.ultimo_acceso ?? user.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-ghost inline-flex items-center gap-2 text-sky-300" onClick={() => setHistoryUser(user)}>
                        <History className="w-4 h-4" />
                        Historial
                      </button>
                      <button className="btn-ghost inline-flex items-center gap-2 text-sky-300" onClick={() => void changeRole(user, user.role === "tecnico" ? "operador" : "tecnico")}>
                        <Shield className="w-4 h-4" />
                        Cambiar rol
                      </button>
                      <button className="btn-ghost inline-flex items-center gap-2 text-red-400" onClick={() => void deactivateUser(user)}>
                        <UserX className="w-4 h-4" />
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? <div className="py-12 text-center text-slate-400">No hay usuarios con esos filtros.</div> : null}
        </SurfaceCard>

        <SurfaceCard elevated className="p-4">
          <div className="mb-4 flex items-center gap-2 text-sky-300">
            <History className="w-5 h-5" />
            <h2 className="text-lg font-semibold">{historyUser ? `Historial de ${historyUser.name}` : "Historial de actividad"}</h2>
          </div>
          {historyLoading ? <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" /></div> : null}
          {!historyLoading && !historyUser ? <div className="text-sm text-slate-400">Selecciona un usuario para ver su historial relacionado.</div> : null}
          {!historyLoading && historyUser ? (
            <div className="space-y-3">
              {historyRows.length > 0 ? historyRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-200">{row.folio ?? row.reference ?? row.id}</div>
                    <Badge variant="neutral">{row.status ?? "Sin estado"}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {row.created_at ? new Date(row.created_at).toLocaleString("es-MX") : "Fecha no disponible"}
                    {row.expected_date ? ` · Esperada ${new Date(row.expected_date).toLocaleDateString("es-MX")}` : ""}
                  </div>
                </div>
              )) : <div className="text-sm text-slate-400">No hay historial asociado para este usuario.</div>}
            </div>
          ) : null}
        </SurfaceCard>
      </div>
    </div>
  );
}
