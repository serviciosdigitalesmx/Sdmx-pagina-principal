"use client";

import { useState, useEffect } from "react";
import { Shield, RefreshCw, Eye, EyeOff, Copy, Check, Users, Key } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserModal } from "@/components/seguridad/user-modal";
import type { SecurityUser, SecurityConfig, AuditLog, SecuritySession } from "@/types";

export default function SeguridadPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SecurityUser | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, configData, auditData, sessionsData] = await Promise.all([
        apiClient.get<{ data: { items: SecurityUser[] } }>("/users", getApiOptions()),
        apiClient.get<{ data: SecurityConfig }>("/security/config", getApiOptions()),
        apiClient.get<{ data: { items: AuditLog[] } }>("/audit", getApiOptions()),
        apiClient.get<{ data: SecuritySession[] }>("/security/sessions", getApiOptions()),
      ]);
      setUsers(usersData.data?.items || []);
      setConfig(configData.data);
      setAuditLogs(auditData.data?.items || []);
      setSessions(sessionsData.data || []);
    } catch (error) {
      console.error("Failed to load security data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSetupMFA = async () => {
    try {
      const data = await apiClient.get<{ data: { secret: string; uri: string } }>("/security/mfa/setup", getApiOptions());
      setMfaSecret(data.data.secret);
      setMfaUri(data.data.uri);
    } catch (error) {
      console.error(error);
      alert("Error al configurar MFA");
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode) {
      alert("Ingresa el código de verificación");
      return;
    }
    try {
      await apiClient.post("/security/mfa/verify", { code: mfaCode }, getApiOptions());
      alert("MFA activado correctamente");
      setMfaSecret(null);
      setMfaUri(null);
      setMfaCode("");
      loadData();
    } catch (error) {
      console.error(error);
      alert("Código inválido");
    }
  };

  const handleCopySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotateKeys = async () => {
    if (!confirm("¿Rotar llaves de seguridad?")) return;
    try {
      await apiClient.post("/security/rotate-keys", {}, getApiOptions());
      alert("Llaves rotadas correctamente");
    } catch (error) {
      console.error(error);
      alert("No se pudieron rotar las llaves");
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><div className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Seguridad</h1>
          <p className="mt-1 text-sm text-srf-muted">{users.length} usuarios · {sessions.length} sesiones activas</p>
        </div>
        <Button onClick={() => loadData()} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-4"><p className="text-srf-muted text-sm">Usuarios</p><p className="text-2xl font-bold">{users.length}</p></div>
        <div className="card p-4"><p className="text-srf-muted text-sm">Sesiones</p><p className="text-2xl font-bold">{sessions.length}</p></div>
        <div className="card p-4"><p className="text-srf-muted text-sm">MFA</p><p className="text-2xl font-bold">{config?.mfa_enabled ? "Activo" : "Off"}</p></div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-srf-primary">MFA</h3>
          <Button onClick={handleSetupMFA} variant="outline">Configurar MFA</Button>
        </div>
        {mfaSecret ? (
          <div className="mt-4 space-y-3 rounded-lg border border-srf-primary/30 bg-srf-surface/50 p-4">
            <p className="text-sm text-srf-muted">Secreto MFA:</p>
            <div className="flex items-center gap-2">
              <Input value={mfaSecret} readOnly />
              <Button onClick={handleCopySecret} variant="outline">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
            </div>
            {mfaUri ? <p className="break-all text-xs text-srf-muted">{mfaUri}</p> : null}
            <div className="flex items-center gap-2">
              <Input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="Código 6 dígitos" />
              <Button onClick={handleVerifyMFA}>Verificar</Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-4 font-semibold text-srf-primary">Usuarios</h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-srf-primary/20 p-3">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-srf-muted">{user.email}</p>
                </div>
                <Button variant="outline" onClick={() => { setSelectedUser(user); setUserModalOpen(true); }}>Editar</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="mb-4 font-semibold text-srf-primary">Sesiones activas</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-srf-primary/20 p-3">
                <p className="font-medium">{session.user_email}</p>
                <p className="text-xs text-srf-muted">{session.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card border-red-500/30 p-4">
        <h3 className="mb-3 font-semibold text-red-300">Rotación de llaves</h3>
        <Button onClick={handleRotateKeys} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">Rotar llaves</Button>
      </div>

      <UserModal open={userModalOpen} onOpenChange={setUserModalOpen} user={selectedUser} onUserSaved={() => loadData()} />
    </div>
  );
}

