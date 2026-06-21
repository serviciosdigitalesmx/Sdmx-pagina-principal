import { supabaseAdmin } from '@white-label/database';
import type {
  JsonObject,
  TenantEnabledModule,
  TenantIndustryProfile,
  TenantFieldDefinition,
  TenantLabelOverride,
  TenantSemaphoreRule,
  TenantRuntimeTemplates,
  TenantWorkflowStatus,
} from '@white-label/types';

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  branding: Record<string, unknown> | null;
  landing_content: Record<string, unknown> | null;
  trial_expires_at: string | null;
  billing_exempt: boolean | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

const DEFAULT_LABELS: Record<string, string> = {
  customer: 'Cliente',
  order: 'Orden',
  request: 'Solicitud',
  asset: 'Equipo',
  portal: 'Seguimiento público',
  quote: 'Cotización',
  landing: 'Sitio del tenant',
  orders: 'Órdenes',
  requests: 'Solicitudes',
  details: 'Detalle',
  status: 'Estado',
};

const DEFAULT_WORKFLOW_STATUSES = [
  { workflow_key: 'service_orders', status_key: 'recibido', label: 'Recibido', tone: 'blue', sort_order: 1, is_default: true, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'en_espera_de_refaccion', label: 'En espera de refacción', tone: 'amber', sort_order: 2, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'diagnostico', label: 'Diagnóstico', tone: 'amber', sort_order: 3, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'cotizado', label: 'Cotizado', tone: 'violet', sort_order: 4, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'reparacion', label: 'En reparación', tone: 'orange', sort_order: 5, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'listo_para_entrega', label: 'Listo para entrega', tone: 'emerald', sort_order: 6, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'listo', label: 'Listo', tone: 'emerald', sort_order: 7, is_default: false, is_terminal: false },
  { workflow_key: 'service_orders', status_key: 'entregado', label: 'Entregado', tone: 'slate', sort_order: 8, is_default: false, is_terminal: true },
  { workflow_key: 'service_requests', status_key: 'pendiente', label: 'Pendiente', tone: 'blue', sort_order: 1, is_default: true, is_terminal: false },
  { workflow_key: 'service_requests', status_key: 'en_revision', label: 'En revisión', tone: 'amber', sort_order: 2, is_default: false, is_terminal: false },
  { workflow_key: 'service_requests', status_key: 'convertida', label: 'Convertida', tone: 'emerald', sort_order: 3, is_default: false, is_terminal: true },
  { workflow_key: 'service_requests', status_key: 'rechazada', label: 'Rechazada', tone: 'rose', sort_order: 4, is_default: false, is_terminal: true },
];

type IndustryTemplate = {
  enabledModules: Array<Pick<TenantEnabledModule, 'module_key' | 'module_label' | 'enabled' | 'sort_order' | 'metadata'>>;
  labels: Record<string, string>;
  workflowStatuses: Array<Pick<TenantWorkflowStatus, 'workflow_key' | 'status_key' | 'label' | 'tone' | 'sort_order' | 'is_default' | 'is_terminal' | 'metadata'>>;
  fieldDefinitions: Array<Pick<TenantFieldDefinition, 'entity' | 'field_key' | 'field_label' | 'field_type' | 'required' | 'options' | 'field_order' | 'placeholder' | 'help_text' | 'visible' | 'validation' | 'metadata'>>;
  semaphoreRules: Array<Pick<TenantSemaphoreRule, 'industry_key' | 'workflow_key' | 'status_key' | 'metric' | 'green_until_minutes' | 'yellow_until_minutes' | 'red_after_minutes' | 'priority' | 'reason_template' | 'suggested_action_template' | 'action_key' | 'enabled' | 'metadata'>>;
  templates: TenantRuntimeTemplates;
};

function templateField(
  entity: string,
  field_key: string,
  field_label: string,
  field_type: TenantFieldDefinition['field_type'],
  options: JsonObject[] | string[] = [],
  extra: Partial<Pick<TenantFieldDefinition, 'required' | 'field_order' | 'placeholder' | 'help_text' | 'visible' | 'validation' | 'metadata'>> = {},
): IndustryTemplate['fieldDefinitions'][number] {
  return {
    entity,
    field_key,
    field_label,
    field_type,
    required: extra.required ?? false,
    options,
    field_order: extra.field_order ?? 0,
    placeholder: extra.placeholder ?? null,
    help_text: extra.help_text ?? null,
    visible: extra.visible ?? true,
    validation: extra.validation ?? {},
    metadata: extra.metadata ?? {},
  };
}

function templateSemaphoreRule(
  status_key: string,
  metric: TenantSemaphoreRule['metric'],
  thresholds: { green?: number | null; yellow?: number | null; red?: number | null },
  reason_template: string,
  suggested_action_template: string,
  extra: Partial<Pick<TenantSemaphoreRule, 'industry_key' | 'workflow_key' | 'priority' | 'action_key' | 'enabled' | 'metadata'>> = {},
): IndustryTemplate['semaphoreRules'][number] {
  return {
    industry_key: extra.industry_key ?? null,
    workflow_key: extra.workflow_key ?? 'service_orders',
    status_key,
    metric,
    green_until_minutes: thresholds.green ?? null,
    yellow_until_minutes: thresholds.yellow ?? null,
    red_after_minutes: thresholds.red ?? null,
    priority: extra.priority ?? 0,
    reason_template,
    suggested_action_template,
    action_key: extra.action_key ?? null,
    enabled: extra.enabled ?? true,
    metadata: extra.metadata ?? {},
  };
}

const CELLPHONE_REPAIR_TEMPLATE: IndustryTemplate = {
  enabledModules: [
    { module_key: 'dashboard', module_label: 'Dashboard', enabled: true, sort_order: 1, metadata: {} },
    { module_key: 'customers', module_label: 'Clientes', enabled: true, sort_order: 2, metadata: {} },
    { module_key: 'requests', module_label: 'Solicitudes', enabled: true, sort_order: 3, metadata: {} },
    { module_key: 'orders', module_label: 'Órdenes', enabled: true, sort_order: 4, metadata: {} },
    { module_key: 'appointments', module_label: 'Citas', enabled: true, sort_order: 5, metadata: {} },
    { module_key: 'assets', module_label: 'Equipo', enabled: true, sort_order: 6, metadata: {} },
    { module_key: 'stock', module_label: 'Stock', enabled: true, sort_order: 7, metadata: {} },
    { module_key: 'expenses', module_label: 'Gastos', enabled: true, sort_order: 8, metadata: {} },
    { module_key: 'documents', module_label: 'Documentos', enabled: true, sort_order: 9, metadata: {} },
    { module_key: 'portal', module_label: 'Portal cliente', enabled: true, sort_order: 10, metadata: {} },
    { module_key: 'landing', module_label: 'Landing', enabled: true, sort_order: 11, metadata: {} },
    { module_key: 'whatsapp', module_label: 'WhatsApp', enabled: true, sort_order: 12, metadata: {} },
    { module_key: 'warranty', module_label: 'Garantía', enabled: true, sort_order: 13, metadata: {} },
    { module_key: 'reports', module_label: 'Reportes', enabled: true, sort_order: 14, metadata: {} },
  ],
  labels: {
    customer: 'Cliente',
    order: 'Orden',
    request: 'Solicitud',
    asset: 'Equipo',
    portal: 'Seguimiento público',
    quote: 'Cotización',
    landing: 'Sitio del tenant',
    orders: 'Órdenes',
    requests: 'Solicitudes',
    details: 'Detalle',
    status: 'Estado',
    technician: 'Técnico',
    diagnosis: 'Diagnóstico',
    delivery: 'Entrega',
    warranty: 'Garantía',
  },
  workflowStatuses: DEFAULT_WORKFLOW_STATUSES.map((entry) => ({
    ...entry,
    metadata: {},
  })),
  fieldDefinitions: [
    templateField('service_requests', 'device_type', 'Tipo de equipo', 'select', ['Celular', 'Tablet', 'Laptop', 'Computadora', 'Consola', 'Otro'], { required: true, field_order: 1, placeholder: 'Selecciona el equipo' }),
    templateField('service_requests', 'device_brand', 'Marca', 'text', [], { required: true, field_order: 2, placeholder: 'Ej. Apple, Samsung, Dell' }),
    templateField('service_requests', 'device_model', 'Modelo', 'text', [], { required: true, field_order: 3, placeholder: 'Ej. iPhone 13, Galaxy S22' }),
    templateField('service_requests', 'serial_number', 'Serie / IMEI', 'text', [], { required: false, field_order: 4, placeholder: 'IMEI o número de serie' }),
    templateField('service_requests', 'accessory_included', 'Incluye accesorios', 'boolean', [], { required: false, field_order: 5 }),
    templateField('service_requests', 'issue_description', 'Problema reportado', 'textarea', [], { required: true, field_order: 6, placeholder: 'Describe la falla con detalle' }),
    templateField('service_requests', 'priority_level', 'Nivel de urgencia', 'select', ['Normal', 'Alta', 'Urgente'], { required: false, field_order: 7, placeholder: 'Selecciona la urgencia' }),
    templateField('service_requests', 'password_or_pin', 'PIN / contraseña', 'text', [], { required: false, field_order: 8, placeholder: 'Solo si el cliente desea compartirlo' }),
    templateField('service_requests', 'authorization_note', 'Autorización / notas', 'textarea', [], { required: false, field_order: 9, placeholder: 'Observaciones de autorización' }),
    templateField('service_orders', 'diagnosis_summary', 'Resumen del diagnóstico', 'textarea', [], { required: false, field_order: 1, placeholder: 'Hallazgos del técnico' }),
    templateField('service_orders', 'repair_estimate', 'Estimado de reparación', 'number', [], { required: false, field_order: 2, placeholder: 'Monto estimado' }),
    templateField('service_orders', 'parts_required', 'Refacciones necesarias', 'textarea', [], { required: false, field_order: 3, placeholder: 'Lista de partes y consumibles' }),
    templateField('service_orders', 'warranty_days', 'Días de garantía', 'number', [], { required: false, field_order: 4, placeholder: 'Ej. 30' }),
    templateField('service_orders', 'serial_number', 'Serie / IMEI', 'text', [], { required: false, field_order: 5, placeholder: 'IMEI o número de serie' }),
  ],
  semaphoreRules: [
    templateSemaphoreRule('recibido', 'minutes_since_status_changed', { green: 24 * 60, yellow: 48 * 60, red: 48 * 60 }, 'Pendiente de diagnóstico', 'Asignar técnico o actualizar diagnóstico', {
      industry_key: 'electronics_repair',
      priority: 100,
    }),
    templateSemaphoreRule('esperando_autorizacion', 'minutes_since_status_changed', { green: 24 * 60, yellow: 72 * 60, red: 72 * 60 }, 'Cliente sin responder autorización', 'Reenviar cotización por WhatsApp', {
      industry_key: 'electronics_repair',
      priority: 90,
    }),
    templateSemaphoreRule('en_reparacion', 'minutes_since_status_changed', { green: 48 * 60, yellow: 96 * 60, red: 96 * 60 }, 'Reparación con tiempo elevado', 'Actualizar avance o fecha promesa', {
      industry_key: 'electronics_repair',
      priority: 80,
    }),
    templateSemaphoreRule('listo', 'minutes_since_status_changed', { green: 48 * 60, yellow: 168 * 60, red: 168 * 60 }, 'Equipo listo sin recoger', 'Enviar recordatorio de entrega', {
      industry_key: 'electronics_repair',
      priority: 70,
    }),
  ],
  templates: {
    whatsapp: [
      {
        event_key: 'solicitud_recibida',
        label: 'Solicitud recibida',
        template: 'Hola {{customer_name}}, recibimos tu solicitud {{order_folio}} en {{business_name}}. Puedes consultar el estado en {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'business_name', 'order_folio', 'order_status', 'portal_url'],
        fallback_template: 'Hola {{customer_name}}, recibimos tu solicitud {{order_folio}}. Puedes consultar el estado en {{portal_url}}.',
      },
    ],
    landing: {
      heroTitle: 'Reparación profesional de electrónicos',
      heroSubtitle: 'Celulares, computadoras, consolas y tablets',
      heroDescription: 'Cotización, estado, diagnóstico y contacto directo con marca propia.',
      primaryCtaLabel: 'Cotizar ahora',
      primaryCtaHref: '/onboarding',
      secondaryCtaLabel: 'Ver estatus',
      secondaryCtaHref: '/login',
      contactLabel: 'WhatsApp / contacto',
      contactHref: '',
      services: [
        { title: 'Celulares', description: 'Pantallas, baterías, carga, software y recuperación de datos.' },
        { title: 'Computadoras', description: 'Laptops, equipos de escritorio, SSD, memoria y limpieza interna.' },
        { title: 'Consolas', description: 'Controles, puertos HDMI, fuentes, ventilación y mantenimiento.' },
      ],
      showMap: false,
      mapEmbedUrl: '',
      showVideo: false,
      videoUrl: '',
      ctaStyle: 'repair',
    },
    portal: {
      heroTitle: 'Seguimiento público',
      heroDescription: 'Consulta el estado, abre el PDF y da seguimiento a tu folio.',
      primaryCtaLabel: 'Consultar folio',
      secondaryCtaLabel: 'Volver al taller',
      documentLabel: 'Documento',
      statusLabel: 'Estado',
    },
    document: {
      title: 'Recepción / PDF de la orden',
      subtitle: 'Documento generado automáticamente por tenant',
    },
  },
};

const HVAC_TEMPLATE: IndustryTemplate = {
  enabledModules: [
    { module_key: 'dashboard', module_label: 'Dashboard', enabled: true, sort_order: 1, metadata: {} },
    { module_key: 'customers', module_label: 'Clientes', enabled: true, sort_order: 2, metadata: {} },
    { module_key: 'requests', module_label: 'Solicitudes', enabled: true, sort_order: 3, metadata: {} },
    { module_key: 'orders', module_label: 'Servicios', enabled: true, sort_order: 4, metadata: {} },
    { module_key: 'appointments', module_label: 'Visitas', enabled: true, sort_order: 5, metadata: {} },
    { module_key: 'assets', module_label: 'Equipo HVAC', enabled: true, sort_order: 6, metadata: {} },
    { module_key: 'stock', module_label: 'Stock', enabled: true, sort_order: 7, metadata: {} },
    { module_key: 'expenses', module_label: 'Gastos', enabled: true, sort_order: 8, metadata: {} },
    { module_key: 'documents', module_label: 'Documentos', enabled: true, sort_order: 9, metadata: {} },
    { module_key: 'portal', module_label: 'Portal cliente', enabled: true, sort_order: 10, metadata: {} },
    { module_key: 'landing', module_label: 'Landing', enabled: true, sort_order: 11, metadata: {} },
    { module_key: 'whatsapp', module_label: 'WhatsApp', enabled: true, sort_order: 12, metadata: {} },
    { module_key: 'warranty', module_label: 'Garantía', enabled: true, sort_order: 13, metadata: {} },
    { module_key: 'reports', module_label: 'Reportes', enabled: true, sort_order: 14, metadata: {} },
  ],
  labels: {
    customer: 'Cliente',
    order: 'Servicio',
    orders: 'Servicios',
    request: 'Solicitud',
    asset: 'Equipo HVAC',
    portal: 'Seguimiento público',
    quote: 'Cotización',
    landing: 'Sitio del tenant',
    technician: 'Técnico',
    diagnosis: 'Revisión',
    delivery: 'Servicio terminado',
    warranty: 'Garantía',
  },
  workflowStatuses: [
    { workflow_key: 'service_orders', status_key: 'solicitud_recibida', label: 'Solicitud recibida', tone: 'blue', sort_order: 1, is_default: true, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'visita_programada', label: 'Visita programada', tone: 'amber', sort_order: 2, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'en_revision', label: 'En revisión', tone: 'orange', sort_order: 3, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'cotizacion_enviada', label: 'Cotización enviada', tone: 'violet', sort_order: 4, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'autorizado', label: 'Autorizado', tone: 'sky', sort_order: 5, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'servicio_programado', label: 'Servicio programado', tone: 'amber', sort_order: 6, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'servicio_realizado', label: 'Servicio realizado', tone: 'emerald', sort_order: 7, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'garantia_activa', label: 'Garantía activa', tone: 'blue', sort_order: 8, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'cerrado', label: 'Cerrado', tone: 'slate', sort_order: 9, is_default: false, is_terminal: true, metadata: {} },
    { workflow_key: 'service_orders', status_key: 'cancelado', label: 'Cancelado', tone: 'rose', sort_order: 10, is_default: false, is_terminal: true, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'pendiente', label: 'Solicitud recibida', tone: 'blue', sort_order: 1, is_default: true, is_terminal: false, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'visita_programada', label: 'Visita programada', tone: 'amber', sort_order: 2, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'cotizacion_enviada', label: 'Cotización enviada', tone: 'violet', sort_order: 3, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'autorizado', label: 'Autorizado', tone: 'emerald', sort_order: 4, is_default: false, is_terminal: false, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'cerrado', label: 'Cerrado', tone: 'slate', sort_order: 5, is_default: false, is_terminal: true, metadata: {} },
    { workflow_key: 'service_requests', status_key: 'cancelado', label: 'Cancelado', tone: 'rose', sort_order: 6, is_default: false, is_terminal: true, metadata: {} },
  ],
  fieldDefinitions: [
    templateField('service_requests', 'service_type', 'Tipo de servicio', 'select', ['Instalación', 'Mantenimiento', 'Reparación', 'Revisión'], { required: true, field_order: 1, placeholder: 'Selecciona el servicio' }),
    templateField('service_requests', 'equipment_type', 'Tipo de equipo', 'select', ['Minisplit', 'Clima central', 'Refrigerador', 'Congelador', 'Otro'], { required: true, field_order: 2, placeholder: 'Selecciona el equipo' }),
    templateField('service_requests', 'tons', 'Capacidad', 'select', ['1', '1.5', '2', '3', '5', 'No sé'], { required: false, field_order: 3, placeholder: 'Selecciona la capacidad' }),
    templateField('service_requests', 'location_area', 'Ubicación del equipo', 'text', [], { required: false, field_order: 4, placeholder: 'Ej. Azotea / sala / local' }),
    templateField('service_requests', 'address_reference', 'Referencias de domicilio', 'textarea', [], { required: false, field_order: 5, placeholder: 'Entre calles, acceso, referencias' }),
    templateField('service_requests', 'issue_description', 'Problema reportado', 'textarea', [], { required: true, field_order: 6, placeholder: 'Describe el problema' }),
    templateField('service_requests', 'preferred_visit_date', 'Fecha preferida de visita', 'date', [], { required: false, field_order: 7, placeholder: 'YYYY-MM-DD' }),
    templateField('service_requests', 'requires_ladder', 'Requiere escalera', 'boolean', [], { required: false, field_order: 8 }),
    templateField('service_requests', 'has_previous_service', 'Ya recibió servicio antes', 'boolean', [], { required: false, field_order: 9 }),
  ],
  semaphoreRules: [
    templateSemaphoreRule('solicitud_recibida', 'minutes_since_created', { green: 120, yellow: 480, red: 480 }, 'Solicitud sin visita agendada', 'Agendar visita y avisar al cliente', {
      industry_key: 'hvac_service',
      priority: 100,
    }),
    templateSemaphoreRule('visita_programada', 'minutes_until_scheduled_at', { green: 180, yellow: 180, red: 0 }, 'Visita próxima o vencida', 'Confirmar técnico y avisar al cliente', {
      industry_key: 'hvac_service',
      priority: 90,
    }),
    templateSemaphoreRule('visita_programada', 'minutes_after_scheduled_at', { green: 0, yellow: 180, red: 0 }, 'Visita próxima o vencida', 'Confirmar técnico y avisar al cliente', {
      industry_key: 'hvac_service',
      priority: 89,
    }),
    templateSemaphoreRule('cotizacion_enviada', 'minutes_since_status_changed', { green: 24 * 60, yellow: 72 * 60, red: 72 * 60 }, 'Cotización sin respuesta', 'Reenviar seguimiento por WhatsApp', {
      industry_key: 'hvac_service',
      priority: 80,
    }),
    templateSemaphoreRule('servicio_programado', 'minutes_until_scheduled_at', { green: 180, yellow: 180, red: 0 }, 'Servicio programado en riesgo', 'Confirmar agenda', {
      industry_key: 'hvac_service',
      priority: 70,
    }),
    templateSemaphoreRule('servicio_programado', 'minutes_after_scheduled_at', { green: 0, yellow: 180, red: 0 }, 'Servicio programado en riesgo', 'Confirmar agenda', {
      industry_key: 'hvac_service',
      priority: 69,
    }),
  ],
  templates: {
    whatsapp: [
      {
        event_key: 'solicitud_recibida',
        label: 'Solicitud recibida',
        template: 'Hola {{customer_name}}, recibimos tu solicitud {{order_folio}} para {{business_name}}. Puedes ver el avance en {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'business_name', 'order_folio', 'order_status', 'portal_url'],
        fallback_template: 'Hola {{customer_name}}, recibimos tu solicitud {{order_folio}}. Consulta el avance en {{portal_url}}.',
      },
      {
        event_key: 'visita_programada',
        label: 'Visita programada',
        template: 'Hola {{customer_name}}, tu visita fue programada para {{estimated_date}}. Folio {{order_folio}}. Detalles en {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'order_folio', 'order_status', 'estimated_date', 'portal_url'],
        fallback_template: 'Hola {{customer_name}}, tu visita fue programada. Consulta tu folio {{order_folio}} en {{portal_url}}.',
      },
      {
        event_key: 'cotizacion_enviada',
        label: 'Cotización enviada',
        template: 'Hola {{customer_name}}, tu cotización de {{business_name}} ya está lista para el folio {{order_folio}}. Revisa {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'business_name', 'order_folio', 'amount_due', 'portal_url'],
        fallback_template: 'Hola {{customer_name}}, tu cotización está lista. Consulta {{portal_url}}.',
      },
      {
        event_key: 'servicio_realizado',
        label: 'Servicio realizado',
        template: 'Hola {{customer_name}}, el servicio {{order_folio}} fue realizado. Consulta el detalle y garantía en {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'order_folio', 'portal_url', 'order_status'],
        fallback_template: 'Hola {{customer_name}}, el servicio {{order_folio}} fue realizado. Consulta {{portal_url}}.',
      },
      {
        event_key: 'garantia_activa',
        label: 'Garantía activa',
        template: 'Hola {{customer_name}}, tu servicio {{order_folio}} ahora cuenta con garantía activa. Consulta detalles en {{portal_url}}.',
        enabled: true,
        variables: ['customer_name', 'order_folio', 'portal_url', 'order_status'],
        fallback_template: 'Hola {{customer_name}}, tu servicio {{order_folio}} cuenta con garantía activa.',
      },
    ],
    landing: {
      heroTitle: 'Servicios HVAC confiables',
      heroSubtitle: 'Instalación, mantenimiento y reparación',
      heroDescription: 'Programa visitas, solicita cotización y da seguimiento a tu servicio con marca propia.',
      primaryCtaLabel: 'Solicitar visita',
      primaryCtaHref: '/onboarding',
      secondaryCtaLabel: 'Ver estatus',
      secondaryCtaHref: '/login',
      contactLabel: 'WhatsApp / contacto',
      contactHref: '',
      services: [
        { title: 'Instalación', description: 'Instalación segura y puesta en marcha del equipo.' },
        { title: 'Mantenimiento', description: 'Limpieza, revisión y prevención de fallas.' },
        { title: 'Reparación', description: 'Diagnóstico y reparación de equipos HVAC.' },
      ],
      showMap: false,
      mapEmbedUrl: '',
      showVideo: false,
      videoUrl: '',
      ctaStyle: 'hvac',
      coverageAreas: ['Residencial', 'Comercial', 'Industrial'],
    },
    portal: {
      heroTitle: 'Portal de servicio HVAC',
      heroDescription: 'Consulta el estatus, cotización y garantía de tu servicio.',
      primaryCtaLabel: 'Consultar folio',
      secondaryCtaLabel: 'Volver al taller',
      documentLabel: 'Documento',
      statusLabel: 'Servicio',
      assetLabel: 'Equipo HVAC',
    },
    document: {
      title: 'Servicio HVAC / PDF',
      subtitle: 'Documento generado automáticamente por tenant',
    },
  },
};

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  electronics_repair: CELLPHONE_REPAIR_TEMPLATE,
  cellphone_repair: CELLPHONE_REPAIR_TEMPLATE,
  hvac_service: HVAC_TEMPLATE,
};

export function getIndustryTemplate(industryKey?: string | null) {
  return INDUSTRY_TEMPLATES[(industryKey ?? '').trim()] ?? INDUSTRY_TEMPLATES.electronics_repair;
}

export function listAvailableIndustries() {
  return [
    {
      key: 'electronics_repair',
      label: 'Reparación de electrónicos',
      description: 'Celulares, tablets, laptops, consolas y soporte técnico general.',
      defaultWorkflowKey: 'service_orders',
      modules: CELLPHONE_REPAIR_TEMPLATE.enabledModules.map((module) => module.module_key),
    },
    {
      key: 'hvac_service',
      label: 'Servicios HVAC',
      description: 'Instalación, mantenimiento y seguimiento de servicios de climatización.',
      defaultWorkflowKey: 'service_orders',
      modules: HVAC_TEMPLATE.enabledModules.map((module) => module.module_key),
    },
  ];
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readJsonObject(input: unknown): JsonObject {
  return input && typeof input === 'object' && !Array.isArray(input) ? (input as JsonObject) : {};
}

function mergeLabels(
  industryProfile: TenantIndustryProfile | null,
  labelOverrides: TenantLabelOverride[],
  operationalSettings: Record<string, unknown> | null,
) : Record<string, string> {
  const operationalLabelsRaw =
    operationalSettings && typeof operationalSettings === 'object' && !Array.isArray(operationalSettings)
      ? readJsonObject((operationalSettings as Record<string, unknown>).labels)
      : {};
  const operationalLabels = Object.entries(operationalLabelsRaw).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const base: Record<string, string> = {
    ...DEFAULT_LABELS,
    ...operationalLabels,
  };

  const industryTemplate = getIndustryTemplate(industryProfile?.industry_key ?? 'electronics_repair');
  base.customer = industryTemplate.labels.customer || base.customer;
  base.order = industryTemplate.labels.order || base.order;
  base.request = industryTemplate.labels.request || base.request;
  base.asset = industryTemplate.labels.asset || base.asset;
  base.portal = industryTemplate.labels.portal || base.portal;
  base.quote = industryTemplate.labels.quote || base.quote;
  base.landing = industryTemplate.labels.landing || base.landing;
  base.orders = industryTemplate.labels.orders || base.orders;
  base.requests = industryTemplate.labels.requests || base.requests;
  base.details = industryTemplate.labels.details || base.details;
  base.status = industryTemplate.labels.status || base.status;
  base.technician = industryTemplate.labels.technician || base.technician;
  base.diagnosis = industryTemplate.labels.diagnosis || base.diagnosis;
  base.delivery = industryTemplate.labels.delivery || base.delivery;
  base.warranty = industryTemplate.labels.warranty || base.warranty;

  if (industryProfile) {
    base.customer = industryProfile.customer_label || base.customer;
    base.order = industryProfile.order_label || base.order;
    base.request = industryProfile.request_label || base.request;
    base.asset = industryProfile.asset_label || base.asset;
    base.portal = industryProfile.portal_label || base.portal;
    base.quote = industryProfile.quote_label || base.quote;
  }

  for (const override of labelOverrides) {
    if (override.label_key.trim()) {
      base[override.label_key.trim()] = override.label_value.trim();
    }
  }

  return base;
}

function mergeWorkflowStatuses(
  workflowStatuses: TenantWorkflowStatus[],
  operationalSettings: Record<string, unknown> | null,
  industryKey?: string | null,
) {
  const operationalStatusesRaw = operationalSettings?.orderStatuses;
  const operationalStatuses = Array.isArray(operationalStatusesRaw)
    ? operationalStatusesRaw
        .map((entry) => {
          const item = readJsonObject(entry);
          const key = normalizeText(item.key);
          if (!key) return null;
          return {
            workflow_key: 'service_orders',
            status_key: key,
            label: normalizeText(item.label) || key,
            tone: normalizeText(item.tone) || null,
            sort_order: Number(item.sort_order ?? 0),
            is_default: Boolean(item.is_default),
            is_terminal: Boolean(item.is_terminal),
            metadata: item,
          };
        })
        .filter(Boolean) as TenantWorkflowStatus[]
    : [];

  const combined = [...workflowStatuses, ...operationalStatuses];
  if (combined.length > 0) {
    return combined;
  }

  const industryTemplate = getIndustryTemplate(industryKey);
  const templateWorkflows = industryTemplate.workflowStatuses.length > 0 ? industryTemplate.workflowStatuses : DEFAULT_WORKFLOW_STATUSES;

  return templateWorkflows.map((entry) => ({
    id: `${entry.workflow_key}:${entry.status_key}`,
    tenant_id: '',
    ...entry,
    metadata: {},
  })) as TenantWorkflowStatus[];
}

function readFieldDefinitionsFromOperationalSettings(operationalSettings: Record<string, unknown> | null): TenantFieldDefinition[] {
  const rawDefinitions = operationalSettings && typeof operationalSettings === 'object'
    ? operationalSettings.fieldDefinitions
    : null;

  if (!Array.isArray(rawDefinitions)) {
    return [];
  }

  return rawDefinitions
    .map((entry, index) => {
      const item = readJsonObject(entry);
      const fieldKey = normalizeText(item.field_key ?? item.key);
      const entity = normalizeText(item.entity);
      const fieldType = normalizeText(item.field_type ?? item.type);
      if (!fieldKey || !entity || !fieldType) {
        return null;
      }
      return {
        id: `${entity}:${fieldKey}:${index}`,
        tenant_id: '',
        entity,
        field_key: fieldKey,
        field_label: normalizeText(item.field_label ?? item.label) || fieldKey,
        field_type: fieldType as TenantFieldDefinition['field_type'],
        required: Boolean(item.required),
        options: Array.isArray(item.options) ? item.options : [],
        field_order: Number(item.field_order ?? item.order ?? index),
        placeholder: normalizeText(item.placeholder) || null,
        help_text: normalizeText(item.help_text) || null,
        visible: item.visible === false ? false : true,
        validation: readJsonObject(item.validation),
        metadata: readJsonObject(item.metadata),
      } satisfies TenantFieldDefinition;
    })
    .filter(Boolean) as TenantFieldDefinition[];
}

export async function loadTenantRuntimeConfig(tenantId: string): Promise<{
  tenant: TenantRow | null;
  industryProfile: TenantIndustryProfile | null;
  enabledModules: TenantEnabledModule[];
  labelOverrides: TenantLabelOverride[];
  workflowStatuses: TenantWorkflowStatus[];
  fieldDefinitions: TenantFieldDefinition[];
  semaphoreRules: TenantSemaphoreRule[];
  templates: TenantRuntimeTemplates;
  labels: Record<string, string>;
  statusOptions: Record<string, Array<{ key: string; label: string; tone?: string | null; isDefault?: boolean; isTerminal?: boolean }>>;
  statusLabels: Record<string, string>;
  activeModules: string[];
  capabilities: null;
}> {
  const [
    tenantResult,
    industryResult,
    modulesResult,
    labelsResult,
    workflowResult,
    fieldDefinitionsResult,
    semaphoreRulesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('tenants')
      .select('id, slug, name, branding, landing_content, trial_expires_at, billing_exempt')
      .eq('id', tenantId)
      .maybeSingle(),
    supabaseAdmin
      .from('tenant_industry_profiles')
      .select('tenant_id, industry_key, industry_label, asset_label, order_label, request_label, customer_label, portal_label, quote_label, default_workflow_key, is_active, metadata')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabaseAdmin
      .from('tenant_enabled_modules')
      .select('id, tenant_id, module_key, module_label, enabled, sort_order, metadata')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })
      .order('module_key', { ascending: true }),
    supabaseAdmin
      .from('tenant_label_overrides')
      .select('id, tenant_id, label_key, label_value, context')
      .eq('tenant_id', tenantId)
      .order('label_key', { ascending: true }),
    supabaseAdmin
      .from('tenant_workflow_statuses')
      .select('id, tenant_id, workflow_key, status_key, label, tone, sort_order, is_default, is_terminal, metadata')
      .eq('tenant_id', tenantId)
      .order('workflow_key', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('status_key', { ascending: true }),
    supabaseAdmin
      .from('tenant_field_definitions')
      .select('id, tenant_id, entity, field_key, field_label, field_type, required, options, field_order, placeholder, help_text, visible, validation, metadata')
      .eq('tenant_id', tenantId)
      .order('entity', { ascending: true })
      .order('field_order', { ascending: true })
      .order('field_key', { ascending: true }),
    supabaseAdmin
      .from('tenant_semaphore_rules')
      .select('id, tenant_id, industry_key, workflow_key, status_key, metric, green_until_minutes, yellow_until_minutes, red_after_minutes, priority, reason_template, suggested_action_template, action_key, enabled, metadata, created_at')
      .eq('tenant_id', tenantId)
      .order('priority', { ascending: false })
      .order('status_key', { ascending: true }),
  ]);

  if (tenantResult.error) {
    throw new Error(tenantResult.error.message);
  }

  if (industryResult.error) {
    throw new Error(industryResult.error.message);
  }

  if (modulesResult.error) {
    throw new Error(modulesResult.error.message);
  }

  if (labelsResult.error) {
    throw new Error(labelsResult.error.message);
  }

  if (workflowResult.error) {
    throw new Error(workflowResult.error.message);
  }

  if (fieldDefinitionsResult.error) {
    throw new Error(fieldDefinitionsResult.error.message);
  }

  if (semaphoreRulesResult.error) {
    throw new Error(semaphoreRulesResult.error.message);
  }

  const tenant = tenantResult.data ?? null;
  const industryProfile = (industryResult.data as TenantIndustryProfile | null) ?? null;
  const enabledModulesFromDb = (((modulesResult.data as TenantEnabledModule[] | null) ?? []) as TenantEnabledModule[]).filter((item) => item.enabled);
  const labelOverrides = ((labelsResult.data as TenantLabelOverride[] | null) ?? []);
  const industryKey = industryProfile?.industry_key ?? 'electronics_repair';
  const industryTemplate = getIndustryTemplate(industryKey);
  const operationalFieldDefinitions = readFieldDefinitionsFromOperationalSettings(null);
  const workflowStatuses = mergeWorkflowStatuses(((workflowResult.data as TenantWorkflowStatus[] | null) ?? []), null, industryKey);
  const fieldDefinitions = (((fieldDefinitionsResult.data as TenantFieldDefinition[] | null) ?? []) as TenantFieldDefinition[]).length > 0
    ? ((fieldDefinitionsResult.data as TenantFieldDefinition[] | null) ?? [])
    : operationalFieldDefinitions.length > 0
      ? operationalFieldDefinitions
      : industryTemplate.fieldDefinitions.map((entry, index) => ({
          id: `${entry.entity}:${entry.field_key}:${index}`,
          tenant_id: '',
          ...entry,
        }));
  const semaphoreRules = (((semaphoreRulesResult.data as TenantSemaphoreRule[] | null) ?? []) as TenantSemaphoreRule[]).length > 0
    ? ((semaphoreRulesResult.data as TenantSemaphoreRule[] | null) ?? [])
    : industryTemplate.semaphoreRules.map((entry, index) => ({
        id: `${entry.workflow_key ?? 'service_orders'}:${entry.status_key}:${index}`,
        tenant_id: '',
        ...entry,
      }));
  const resolvedEnabledModules = enabledModulesFromDb.length > 0
    ? enabledModulesFromDb
    : industryTemplate.enabledModules.map((entry, index) => ({
        id: `${entry.module_key}:${index}`,
        tenant_id: '',
        ...entry,
      })) as TenantEnabledModule[];
  const labels = mergeLabels(industryProfile, labelOverrides, null);
  const statusOptions = workflowStatuses.reduce<Record<string, Array<{ key: string; label: string; tone?: string | null; isDefault?: boolean; isTerminal?: boolean }>>>((acc, entry) => {
    const workflowKey = entry.workflow_key || 'service_orders';
    if (!acc[workflowKey]) {
      acc[workflowKey] = [];
    }
    acc[workflowKey].push({
      key: entry.status_key,
      label: entry.label,
      tone: entry.tone,
      isDefault: entry.is_default,
      isTerminal: entry.is_terminal,
    });
    return acc;
  }, {});
  const statusLabels = workflowStatuses.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.status_key] = entry.label;
    return acc;
  }, {});

  return {
    tenant,
    industryProfile,
    enabledModules: resolvedEnabledModules,
    labelOverrides,
    workflowStatuses,
    fieldDefinitions,
    semaphoreRules,
    templates: industryTemplate.templates,
    labels,
    statusOptions,
    statusLabels,
    activeModules: resolvedEnabledModules.map((item) => item.module_key),
    capabilities: null,
  };
}
