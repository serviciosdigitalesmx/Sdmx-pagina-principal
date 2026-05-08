-- =====================================================
-- Corrección de políticas RLS para aislamiento multi-tenant fuerte
-- Cambia políticas que usan current_setting por auth_tenant_id()
-- =====================================================

-- Función para setear tenant_id en la sesión (para uso desde backend)
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo permitir si el usuario autenticado pertenece al tenant
  IF p_tenant_id = auth_tenant_id() THEN
    PERFORM set_config('app.current_tenant', p_tenant_id::text, false);
  ELSE
    RAISE EXCEPTION 'Acceso denegado: tenant_id no autorizado';
  END IF;
END;
$$;

-- Actualizar políticas para tablas legacy
DROP POLICY IF EXISTS tenant_clientes ON clientes;
CREATE POLICY tenant_clientes ON clientes
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS tenant_equipos ON equipos;
CREATE POLICY tenant_equipos ON equipos
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS tenant_equipo_historial ON equipo_historial;
CREATE POLICY tenant_equipo_historial ON equipo_historial
USING (equipo_id IN (SELECT id FROM equipos WHERE tenant_id = auth_tenant_id()));

DROP POLICY IF EXISTS tenant_equipo_fotos ON equipo_fotos;
CREATE POLICY tenant_equipo_fotos ON equipo_fotos
USING (equipo_id IN (SELECT id FROM equipos WHERE tenant_id = auth_tenant_id()));

DROP POLICY IF EXISTS tenant_solicitudes ON solicitudes_cotizacion;
CREATE POLICY tenant_solicitudes ON solicitudes_cotizacion
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS tenant_cotizaciones ON cotizaciones;
CREATE POLICY tenant_cotizaciones ON cotizaciones
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS tenant_movimientos ON movimientos_stock;
CREATE POLICY tenant_movimientos ON movimientos_stock
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS tenant_transferencias ON transferencias_stock;
CREATE POLICY tenant_transferencias ON transferencias_stock
USING (tenant_id = auth_tenant_id())
WITH CHECK (tenant_id = auth_tenant_id());

-- Asegurar que todas las tablas principales tengan políticas consistentes
-- (Las demás ya usan auth_tenant_id() correctamente)

-- Verificar que no haya tablas sin tenant_id
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('tenants', 'permissions', 'status_transition_policy')
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        -- Verificar si la tabla tiene tenant_id
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.tablename
            AND column_name = 'tenant_id'
        ) THEN
            RAISE WARNING 'Tabla % no tiene columna tenant_id', table_record.tablename;
        END IF;
    END LOOP;
END $$;