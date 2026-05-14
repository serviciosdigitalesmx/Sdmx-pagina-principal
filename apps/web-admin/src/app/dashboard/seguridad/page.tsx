import { ModuleShell } from '@/components/dashboard/module-shell';

export default function SeguridadPage() {
  return (
    <ModuleShell
      title="Seguridad y roles"
      subtitle="Administración de usuarios, permisos y acceso al tenant con enfoque multi-tenant."
      icon="fas fa-shield-alt"
      actionLabel="+ Invitar usuario"
      stats={[
        { label: 'Usuarios', value: '0', helper: 'Se conectará a autenticación real.' },
        { label: 'Roles', value: '0', helper: 'Preparado para RBAC.' },
        { label: 'Permisos', value: '0', helper: 'Sin catálogo simulado.' },
      ]}
      columns={[
        { label: 'Usuario', key: 'usuario' },
        { label: 'Rol', key: 'rol' },
        { label: 'Sucursal', key: 'sucursal' },
        { label: 'Estado', key: 'estado' },
      ]}
      rows={[]}
      emptyTitle="IAM pendiente de integración real"
      emptyCopy="La ruta queda preparada para invitar usuarios, administrar roles y controlar permisos por tenant. La lógica de acceso se conectará en la siguiente iteración."
    />
  );
}
