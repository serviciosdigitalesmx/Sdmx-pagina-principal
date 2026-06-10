'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Shield, Users, Key, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserModal } from '@/components/seguridad/user-modal';
import type { SecurityUser, SecurityConfig, AuditLog, SecuritySession } from '@/types';

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
  const [mfaCode, setMfaCode] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, configData, auditData, sessionsData] = await Promise.all([
        apiClient.get<{ data: { items: SecurityUser[] } }>('/users', getApiOptions()),
        apiClient.get<{ data: SecurityConfig }>('/security/config', getApiOptions()),
        apiClient.get<{ data: { items: AuditLog[] } }>('/security/audit', getApiOptions()),
        apiClient.get<{ data: SecuritySession[] }>('/security/sessions', getApiOptions()),
      ]);

      setUsers(usersData.data?.items || []);
      setConfig(configData.data);
      setAuditLogs(auditData.data?.items || []);
      setSessions(sessionsData.data || []);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetupMFA = async () => {
    try {
      const data = await apiClient.get<{ data: { secret: string; uri: string } }>('/security/mfa/setup', getApiOptions());
      setMfaSecret(data.data.secret);
      setMfaUri(data.data.uri);
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      alert('Error al configurar MFA');
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode) {
      alert('Ingresa el código de verificación');
      return;
    }
    try {
      await apiClient.post('/security/mfa/verify', { code: mfaCode }, getApiOptions());
      alert('MFA activado correctamente');
      setMfaSecret(null);
      setMfaUri(null);
      setMfaCode('');
      loadData();
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      alert('Código inválido');
    }
  };

  const handleCopySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('¿Revocar esta sesión?')) return;
    try {
      await apiClient.delete(`/security/sessions/${sessionId}`, getApiOptions());
      loadData();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Error al revocar la sesión');
    }
  };

  const handleRotateKeys = async () => {
    if (!confirm('¿Rotar las claves JWT? Todas las sesiones activas serán invalidadas.')) return;
    try {
      await apiClient.post('/security/rotate-keys', { confirm: true }, getApiOptions());
      alert('Claves rotadas exitosamente');
      loadData();
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      alert('Error al rotar las claves');
    }
  };

  const handleUpdateConfig = async (field: string, value: unknown) => {
    try {
      await apiClient.patch('/security/config', { [field]: value }, getApiOptions());
      loadData();
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-MX');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Seguridad</h1>
        <p className="text-srf-muted text-sm mt-1">Usuarios, permisos y configuración de seguridad</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-srf-primary">{users.length}</div>
          <div className="text-xs text-srf-muted">Usuarios activos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-srf-primary">{sessions.length}</div>
          <div className="text-xs text-srf-muted">Sesiones activas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-srf-primary">
            {config?.adminPasswordConfigured ? 'Sí' : 'No'}
          </div>
          <div className="text-xs text-srf-muted">Clave admin configurada</div>
        </div>
      </div>

      {/* Users section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-srf-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios internos
          </h2>
          <Button
            onClick={() => {
              setSelectedUser(null);
              setUserModalOpen(true);
            }}
            className="btn-primary gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-srf-muted border-b border-srf-primary/30">
              <tr>
                <th className="text-left py-2">Usuario</th>
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Rol</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-srf-primary/20">
                  <td className="py-2 font-mono text-srf-primary">{user.name}</td>
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">
                    <span className="badge-recibido text-xs">{user.role}</span>
                  </td>
                  <td className="py-2">
                    <span className={user.activo ? 'badge-listo text-xs' : 'badge-cancelado text-xs'}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setUserModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MFA Setup */}
      {!config?.adminPasswordConfigured && (
        <div className="card">
          <h2 className="text-lg font-bold text-srf-primary flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            Configurar MFA
          </h2>

          {!mfaSecret ? (
            <Button onClick={handleSetupMFA} variant="outline">
              Iniciar configuración MFA
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-srf-bg rounded-lg p-4">
                <p className="text-sm text-srf-muted mb-2">
                  1. Escanea este código QR con Google Authenticator:
                </p>
                <div className="flex justify-center mb-4">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaUri || '')}`}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="border-2 border-srf-primary rounded-lg"
                    unoptimized
                  />
                </div>
                <p className="text-sm text-srf-muted mb-2">
                  2. O ingresa este código manualmente:
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-srf-bg px-3 py-2 rounded font-mono text-sm">{mfaSecret}</code>
                  <button onClick={handleCopySecret} className="p-2 rounded hover:bg-srf-primary/20">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Código de verificación</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                  />
                  <Button onClick={handleVerifyMFA} className="btn-primary">
                    Verificar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-srf-primary flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5" />
            Sesiones activas
          </h2>

          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-srf-bg rounded-lg">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{session.user?.name || session.userId}</span>
                  </p>
                  <p className="text-xs text-srf-muted">
                    IP: {session.ipAddress || 'Desconocida'} · Última actividad: {formatDate(session.lastActivityAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  Revocar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {auditLogs.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-srf-primary flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            Bitácora de seguridad
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2 border-b border-srf-primary/20 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-srf-primary">{log.action}</span>
                  <span className="text-xs text-srf-muted">{formatDate(log.created_at)}</span>
                </div>
                <p className="text-xs text-srf-muted mt-1">
                  Usuario: {log.user_id || 'Sistema'} · IP: {log.ip_address || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card border-red-500/30">
        <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" />
          Zona de riesgo
        </h2>
        <p className="text-sm text-srf-muted mb-4">
          Rotar las claves JWT invalidará todas las sesiones activas. Los usuarios deberán volver a iniciar sesión.
        </p>
        <Button onClick={handleRotateKeys} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
          Rotar claves JWT
        </Button>
      </div>

      {/* User Modal */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUser}
        onUserSaved={() => loadData()}
      />
    </div>
  );
}

import { Plus, Edit2 } from 'lucide-react';
