import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';
import { loadTenantBillingSummary } from '../services/tenant-billing';
import { getIndustryTemplate, listAvailableIndustries, loadTenantRuntimeConfig } from '../services/tenant-config';
import { resolveTenantCapabilities } from '../services/tenant-capabilities';
import { resolveEffectiveUserRole } from '../lib/user-roles';

export const getApiRoot = (_req: Request, res: Response) => {
  const apiName = process.env.API_NAME ?? 'White-label API';

  return res.status(200).json({
    name: apiName,
    status: 'ok',
    routes: {
      health: ['/health', '/healthz', '/api/health'],
      auth: ['/api/auth/me'],
    },
  });
};

const brandingAssetSchema = z.object({
  assetType: z.enum(['logo', 'favicon', 'heroImage', 'coverImage']),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  base64: z.string().min(1),
});

function getBrandingBucketName() {
  return process.env.SUPABASE_BRANDING_BUCKET ?? 'tenant-branding-assets';
}

function getFileExtension(fileName: string, mimeType: string) {
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  const lower = fileName.toLowerCase();
  const dotIndex = lower.lastIndexOf('.');
  return dotIndex >= 0 ? lower.slice(dotIndex + 1) : mimeType.split('/').pop() ?? 'bin';
}

function decodeBase64File(base64: string) {
  const cleaned = base64.includes(',') ? base64.split(',').pop() ?? '' : base64;
  return Buffer.from(cleaned, 'base64');
}

async function ensureBucketExists(bucketName: string) {
  const { error } = await supabaseAdmin.storage.getBucket(bucketName);
  if (!error) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    fileSizeLimit: 5 * 1024 * 1024,
  });

  if (createError) {
    throw new Error(`Unable to ensure storage bucket ${bucketName}: ${createError.message}`);
  }
}

export const getHealth = (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: process.env.API_NAME ?? 'White-label API',
  });
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      sub: req.user.sub ?? null,
      email: req.user.email ?? null,
      role: req.user.role,
      tenantId: req.user.tenantId,
      sucursalId: req.scope?.sucursalId ?? null,
    },
  });
};

export const resolveTenantForSupabaseUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.slice('Bearer '.length).trim();

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return res.status(401).json({ error: error?.message ?? 'Unable to validate session' });
    }

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role, sucursal_id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (userRowError) {
      return res.status(502).json({ error: userRowError.message });
    }

    if (!userRow?.tenant_id) {
      return res.status(404).json({ error: 'Tenant not found for authenticated user' });
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, name')
      .eq('id', userRow.tenant_id)
      .maybeSingle();

    if (tenantError) {
      return res.status(502).json({ error: tenantError.message });
    }

    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.status(200).json({
      user: {
        sub: data.user.id,
        email: data.user.email ?? null,
        tenantId: tenantRow.id,
        tenantSlug: tenantRow.slug,
        role: resolveEffectiveUserRole(userRow.role) ?? userRow.role,
        sucursalId: userRow.sucursal_id ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getTenantSettings = async (req: Request, res: Response) => {
  const tenantSlug = req.params.tenantSlug;
  const tenantId = req.tenantId ?? null;

  if (!tenantSlug && !tenantId) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const query = supabaseAdmin
      .from('tenants')
      .select('id, slug, name, branding, landing_content, trial_expires_at, billing_exempt, require_admin_mfa');

    const { data, error } = tenantId
      ? await query.eq('id', tenantId).maybeSingle()
      : await query.eq('slug', tenantSlug).maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Tenant not found', details: error?.message ?? 'Not found' });
    }

    const billing = await loadTenantBillingSummary(data.id, data.slug);
    const config = await loadTenantRuntimeConfig(data.id);
    const capabilities = resolveTenantCapabilities({
      tenantId: data.id,
      tenantSlug: data.slug,
      tenantEmail: req.user?.email ?? null,
      billing,
      runtimeConfig: config,
    });

    return res.status(200).json({
      success: true,
      data: {
        tenant: {
          ...data,
          operational_settings: null,
          industry_profile: config.industryProfile,
          enabled_modules: config.enabledModules,
          label_overrides: config.labelOverrides,
          workflow_statuses: config.workflowStatuses,
          field_definitions: config.fieldDefinitions,
          semaphore_rules: config.semaphoreRules,
          templates: config.templates,
          labels: config.labels,
          status_options: config.statusOptions,
          status_labels: config.statusLabels,
          active_modules: config.activeModules,
          capabilities,
        },
        billing,
        availableIndustries: listAvailableIndustries(),
        config: {
          ...config,
          capabilities,
          availableIndustries: listAvailableIndustries(),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const updateTenantSettings = async (req: Request, res: Response) => {
  const tenantSlug = req.params.tenantSlug;
  const tenantId = req.tenantId ?? null;

  if (!tenantSlug && !tenantId) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const tenantQuery = supabaseAdmin
      .from('tenants')
      .select('id, slug');

    const { data: tenantRow, error: tenantError } = tenantId
      ? await tenantQuery.eq('id', tenantId).maybeSingle()
      : await tenantQuery.eq('slug', tenantSlug).maybeSingle();

    if (tenantError || !tenantRow) {
      return res.status(404).json({ error: 'Tenant not found', details: tenantError?.message ?? 'Not found' });
    }

    const body = req.body as Record<string, unknown>;
    const branding = (body.branding && typeof body.branding === 'object') ? body.branding : null;
    const landingContent = (body.landingContent && typeof body.landingContent === 'object') ? body.landingContent : null;
    const industryProfile = (body.industryProfile && typeof body.industryProfile === 'object') ? body.industryProfile : null;
    const enabledModules = Array.isArray(body.enabledModules) ? body.enabledModules : null;
    const labelOverrides = Array.isArray(body.labelOverrides) ? body.labelOverrides : null;
    const workflowStatuses = Array.isArray(body.workflowStatuses) ? body.workflowStatuses : null;
    const fieldDefinitions = Array.isArray(body.fieldDefinitions) ? body.fieldDefinitions : null;
    const semaphoreRules = Array.isArray(body.semaphoreRules) ? body.semaphoreRules : null;
    const nextUpdate: Record<string, unknown> = {};

    if (branding) {
      nextUpdate.branding = branding;
    }

    if (landingContent) {
      nextUpdate.landing_content = landingContent;
    }

    // `operational_settings` is not part of the live production schema yet.
    // Keep the payload shape accepted by the API, but do not persist it here.

    let data = tenantRow;
    if (Object.keys(nextUpdate).length > 0) {
      const { data: updatedTenant, error } = await supabaseAdmin
        .from('tenants')
        .update(nextUpdate)
        .eq('id', tenantRow.id)
        .select('id, slug, name, branding, landing_content, trial_expires_at, billing_exempt')
        .single();

      if (error || !updatedTenant) {
        return res.status(502).json({ error: 'Failed to update tenant settings', details: error?.message ?? 'Unknown error' });
      }

      data = updatedTenant;
    }

    if (industryProfile) {
      const industryRecord = industryProfile as Record<string, unknown>;
      const industryKey = String(industryRecord.industry_key ?? industryRecord.industryKey ?? 'electronics_repair').trim() || 'electronics_repair';
      const industryTemplate = getIndustryTemplate(industryKey);
      const defaultAssetLabel = industryTemplate.labels.asset ?? 'Equipo';
      const defaultOrderLabel = industryTemplate.labels.order ?? 'Orden';
      const defaultRequestLabel = industryTemplate.labels.request ?? 'Solicitud';
      const defaultCustomerLabel = industryTemplate.labels.customer ?? 'Cliente';
      const defaultPortalLabel = industryTemplate.labels.portal ?? 'Seguimiento público';
      const defaultQuoteLabel = industryTemplate.labels.quote ?? 'Cotización';
      const industryPayload = {
        tenant_id: tenantRow.id,
        industry_key: industryKey,
        industry_label: typeof industryRecord.industry_label === 'string' ? industryRecord.industry_label.trim() : typeof industryRecord.industryLabel === 'string' ? industryRecord.industryLabel.trim() : null,
        asset_label: String(industryRecord.asset_label ?? industryRecord.assetLabel ?? defaultAssetLabel).trim() || defaultAssetLabel,
        order_label: String(industryRecord.order_label ?? industryRecord.orderLabel ?? defaultOrderLabel).trim() || defaultOrderLabel,
        request_label: String(industryRecord.request_label ?? industryRecord.requestLabel ?? defaultRequestLabel).trim() || defaultRequestLabel,
        customer_label: String(industryRecord.customer_label ?? industryRecord.customerLabel ?? defaultCustomerLabel).trim() || defaultCustomerLabel,
        portal_label: String(industryRecord.portal_label ?? industryRecord.portalLabel ?? defaultPortalLabel).trim() || defaultPortalLabel,
        quote_label: String(industryRecord.quote_label ?? industryRecord.quoteLabel ?? defaultQuoteLabel).trim() || defaultQuoteLabel,
        default_workflow_key: String(industryRecord.default_workflow_key ?? industryRecord.defaultWorkflowKey ?? 'service_orders').trim() || 'service_orders',
        is_active: Boolean(industryRecord.is_active ?? industryRecord.isActive ?? true),
        metadata: typeof industryRecord.metadata === 'object' && industryRecord.metadata ? industryRecord.metadata : {},
      };

      const { error: industryError } = await supabaseAdmin
        .from('tenant_industry_profiles')
        .upsert(industryPayload, { onConflict: 'tenant_id' });

      if (industryError) {
        return res.status(502).json({ error: 'Failed to update industry profile', details: industryError.message });
      }
    }

    const currentIndustryKey = typeof industryProfile === 'object' && industryProfile
      ? String((industryProfile as Record<string, unknown>).industry_key ?? (industryProfile as Record<string, unknown>).industryKey ?? 'electronics_repair').trim() || 'electronics_repair'
      : 'electronics_repair';
    const industryTemplate = getIndustryTemplate(currentIndustryKey);
    const industryChanged = Boolean(industryProfile);

    if (Array.isArray(enabledModules) || industryChanged) {
      const moduleSource = Array.isArray(enabledModules) ? enabledModules : industryTemplate.enabledModules;
      const rows = moduleSource
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const record = item as Record<string, unknown>;
          return {
            tenant_id: tenantRow.id,
            module_key: String(record.module_key ?? record.key ?? '').trim(),
            module_label: typeof record.module_label === 'string' ? record.module_label : typeof record.label === 'string' ? record.label : null,
            enabled: Boolean(record.enabled ?? true),
            sort_order: Number.isFinite(Number(record.sort_order)) ? Number(record.sort_order) : index,
            metadata: typeof record.metadata === 'object' && record.metadata ? record.metadata : {},
          };
        })
        .filter((item) => item.module_key.length > 0);

      if (Array.isArray(enabledModules) || industryChanged) {
        const { error: deleteModulesError } = await supabaseAdmin
          .from('tenant_enabled_modules')
          .delete()
          .eq('tenant_id', tenantRow.id);

        if (deleteModulesError) {
          return res.status(502).json({ error: 'Failed to clear enabled modules', details: deleteModulesError.message });
        }
      }

      if (rows.length > 0) {
        const { error: modulesError } = await supabaseAdmin
          .from('tenant_enabled_modules')
          .upsert(rows, { onConflict: 'tenant_id,module_key' });

        if (modulesError) {
          return res.status(502).json({ error: 'Failed to update enabled modules', details: modulesError.message });
        }
      }
    }

    if (Array.isArray(labelOverrides) || industryChanged) {
      const labelSource = Array.isArray(labelOverrides) ? labelOverrides : [];
      const rows = labelSource
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const record = item as Record<string, unknown>;
          return {
            tenant_id: tenantRow.id,
            label_key: String(record.label_key ?? record.key ?? '').trim(),
            label_value: String(record.label_value ?? record.value ?? '').trim(),
            context: typeof record.context === 'object' && record.context ? record.context : {},
          };
        })
        .filter((item) => item.label_key.length > 0 && item.label_value.length > 0);

      const { error: deleteLabelsError } = await supabaseAdmin
        .from('tenant_label_overrides')
        .delete()
        .eq('tenant_id', tenantRow.id);

      if (deleteLabelsError) {
        return res.status(502).json({ error: 'Failed to clear label overrides', details: deleteLabelsError.message });
      }

      if (rows.length > 0) {
        const { error: labelsError } = await supabaseAdmin
          .from('tenant_label_overrides')
          .insert(rows);

        if (labelsError) {
          return res.status(502).json({ error: 'Failed to update label overrides', details: labelsError.message });
        }
      }
    }

    if (Array.isArray(workflowStatuses) || industryChanged) {
      const workflowSource = Array.isArray(workflowStatuses) ? workflowStatuses : industryTemplate.workflowStatuses;
      const rows = workflowSource
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const record = item as Record<string, unknown>;
          return {
            tenant_id: tenantRow.id,
            workflow_key: String(record.workflow_key ?? 'service_orders').trim(),
            status_key: String(record.status_key ?? record.key ?? '').trim(),
            label: String(record.label ?? record.name ?? '').trim(),
            tone: typeof record.tone === 'string' ? record.tone : null,
            sort_order: Number.isFinite(Number(record.sort_order)) ? Number(record.sort_order) : index,
            is_default: Boolean(record.is_default ?? false),
            is_terminal: Boolean(record.is_terminal ?? false),
            metadata: typeof record.metadata === 'object' && record.metadata ? record.metadata : {},
          };
        })
        .filter((item) => item.workflow_key.length > 0 && item.status_key.length > 0 && item.label.length > 0);

      if (Array.isArray(workflowStatuses) || industryChanged) {
        const { error: deleteWorkflowsError } = await supabaseAdmin
          .from('tenant_workflow_statuses')
          .delete()
          .eq('tenant_id', tenantRow.id);

        if (deleteWorkflowsError) {
          return res.status(502).json({ error: 'Failed to clear workflow statuses', details: deleteWorkflowsError.message });
        }
      }

      if (rows.length > 0) {
        const { error: workflowsError } = await supabaseAdmin
          .from('tenant_workflow_statuses')
          .upsert(rows, { onConflict: 'tenant_id,workflow_key,status_key' });

        if (workflowsError) {
          return res.status(502).json({ error: 'Failed to update workflow statuses', details: workflowsError.message });
        }
      }
    }

    if (Array.isArray(fieldDefinitions) || industryChanged) {
      const fieldSource = Array.isArray(fieldDefinitions) ? fieldDefinitions : industryTemplate.fieldDefinitions;
      const rows = fieldSource
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const record = item as Record<string, unknown>;
          const fieldKey = String(record.field_key ?? record.key ?? '').trim();
          const entity = String(record.entity ?? '').trim();
          const fieldType = String(record.field_type ?? record.type ?? 'text').trim();
          return {
            tenant_id: tenantRow.id,
            entity,
            field_key: fieldKey,
            field_label: String(record.field_label ?? record.label ?? fieldKey).trim() || fieldKey,
            field_type: fieldType,
            required: Boolean(record.required ?? false),
            options: Array.isArray(record.options) ? record.options : [],
            field_order: Number.isFinite(Number(record.field_order ?? record.order)) ? Number(record.field_order ?? record.order) : index,
            placeholder: typeof record.placeholder === 'string' ? record.placeholder : null,
            help_text: typeof record.help_text === 'string' ? record.help_text : null,
            visible: record.visible === false ? false : true,
            validation: typeof record.validation === 'object' && record.validation ? record.validation : {},
            metadata: typeof record.metadata === 'object' && record.metadata ? record.metadata : {},
          };
        })
        .filter((item) => item.entity.length > 0 && item.field_key.length > 0 && item.field_label.length > 0);

      if (Array.isArray(fieldDefinitions) || industryChanged) {
        const { error: deleteFieldsError } = await supabaseAdmin
          .from('tenant_field_definitions')
          .delete()
          .eq('tenant_id', tenantRow.id);

        if (deleteFieldsError) {
          return res.status(502).json({ error: 'Failed to clear field definitions', details: deleteFieldsError.message });
        }
      }

      if (rows.length > 0) {
        const { error: fieldsError } = await supabaseAdmin
          .from('tenant_field_definitions')
          .upsert(rows, { onConflict: 'tenant_id,entity,field_key' });

        if (fieldsError) {
          return res.status(502).json({ error: 'Failed to update field definitions', details: fieldsError.message });
        }
      }
    }

    if (Array.isArray(semaphoreRules) || industryChanged) {
      const semaphoreSource = Array.isArray(semaphoreRules) ? semaphoreRules : industryTemplate.semaphoreRules;
      const rows = semaphoreSource
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const record = item as Record<string, unknown>;
          const statusKey = String(record.status_key ?? record.statusKey ?? '').trim();
          const metric = String(record.metric ?? '').trim();
          return {
            tenant_id: tenantRow.id,
            industry_key: typeof record.industry_key === 'string' ? record.industry_key : typeof record.industryKey === 'string' ? record.industryKey : null,
            workflow_key: String(record.workflow_key ?? record.workflowKey ?? 'service_orders').trim() || 'service_orders',
            status_key: statusKey,
            metric,
            green_until_minutes: Number.isFinite(Number(record.green_until_minutes)) ? Number(record.green_until_minutes) : null,
            yellow_until_minutes: Number.isFinite(Number(record.yellow_until_minutes)) ? Number(record.yellow_until_minutes) : null,
            red_after_minutes: Number.isFinite(Number(record.red_after_minutes)) ? Number(record.red_after_minutes) : null,
            priority: Number.isFinite(Number(record.priority)) ? Number(record.priority) : index,
            reason_template: typeof record.reason_template === 'string' ? record.reason_template : typeof record.reasonTemplate === 'string' ? record.reasonTemplate : null,
            suggested_action_template: typeof record.suggested_action_template === 'string' ? record.suggested_action_template : typeof record.suggestedActionTemplate === 'string' ? record.suggestedActionTemplate : null,
            action_key: typeof record.action_key === 'string' ? record.action_key : typeof record.actionKey === 'string' ? record.actionKey : null,
            enabled: record.enabled === false ? false : true,
            metadata: typeof record.metadata === 'object' && record.metadata ? record.metadata : {},
          };
        })
        .filter((item) => item.status_key.length > 0 && item.metric.length > 0);

      if (Array.isArray(semaphoreRules) || industryChanged) {
        const { error: deleteSemaphoreError } = await supabaseAdmin
          .from('tenant_semaphore_rules')
          .delete()
          .eq('tenant_id', tenantRow.id);

        if (deleteSemaphoreError) {
          return res.status(502).json({ error: 'Failed to clear semaphore rules', details: deleteSemaphoreError.message });
        }
      }

      if (rows.length > 0) {
        const { error: semaphoreError } = await supabaseAdmin
          .from('tenant_semaphore_rules')
          .upsert(rows, { onConflict: 'tenant_id,industry_key,workflow_key,status_key,metric' });

        if (semaphoreError) {
          return res.status(502).json({ error: 'Failed to update semaphore rules', details: semaphoreError.message });
        }
      }
    }

    const billing = await loadTenantBillingSummary(data.id, data.slug);
    const config = await loadTenantRuntimeConfig(data.id);
    const capabilities = resolveTenantCapabilities({
      tenantId: data.id,
      tenantSlug: data.slug,
      tenantEmail: req.user?.email ?? null,
      billing,
      runtimeConfig: config,
    });

    return res.status(200).json({
      success: true,
      data: {
        tenant: {
          ...data,
          operational_settings: null,
          industry_profile: config.industryProfile,
          enabled_modules: config.enabledModules,
          label_overrides: config.labelOverrides,
          workflow_statuses: config.workflowStatuses,
          field_definitions: config.fieldDefinitions,
          semaphore_rules: config.semaphoreRules,
          templates: config.templates,
          labels: config.labels,
          status_options: config.statusOptions,
          status_labels: config.statusLabels,
          active_modules: config.activeModules,
          capabilities,
        },
        billing,
        config: {
          ...config,
          capabilities,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const uploadTenantBrandingAsset = async (req: Request, res: Response) => {
  const tenantSlug = req.params.tenantSlug;
  const tenantId = req.tenantId ?? null;

  if (!tenantSlug && !tenantId) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const parsed = brandingAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid branding asset payload',
        details: parsed.error.flatten(),
      });
    }

    const tenantQuery = supabaseAdmin.from('tenants').select('id, slug, branding');
    const { data: tenantRow, error: tenantError } = tenantId
      ? await tenantQuery.eq('id', tenantId).maybeSingle()
      : await tenantQuery.eq('slug', tenantSlug).maybeSingle();

    if (tenantError || !tenantRow) {
      return res.status(404).json({ error: 'Tenant not found', details: tenantError?.message ?? 'Not found' });
    }

    const bucketName = getBrandingBucketName();
    await ensureBucketExists(bucketName);

    const fileBuffer = decodeBase64File(parsed.data.base64);
    const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = getFileExtension(parsed.data.fileName, parsed.data.mimeType);
    const storagePath = `tenant/${tenantRow.id}/branding/${parsed.data.assetType}/${Date.now()}-${randomUUID()}-${safeName}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(storagePath, fileBuffer, {
      contentType: parsed.data.mimeType,
      upsert: false,
    });

    if (uploadError) {
      return res.status(502).json({
        error: 'Failed to upload branding asset',
        details: uploadError.message,
      });
    }

    const { data: publicData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(storagePath);
    const publicUrl = publicData.publicUrl ?? null;
    const currentBranding = (tenantRow.branding && typeof tenantRow.branding === 'object') ? tenantRow.branding as Record<string, unknown> : {};
    const brandingPatch: Record<string, unknown> = { ...currentBranding };

    if (parsed.data.assetType === 'logo') brandingPatch.logoUrl = publicUrl ?? '';
    if (parsed.data.assetType === 'favicon') brandingPatch.faviconUrl = publicUrl ?? '';
    if (parsed.data.assetType === 'heroImage') brandingPatch.heroImageUrl = publicUrl ?? '';
    if (parsed.data.assetType === 'coverImage') brandingPatch.coverImageUrl = publicUrl ?? '';

    const { data: updatedTenant, error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ branding: brandingPatch })
      .eq('id', tenantRow.id)
      .select('id, slug, name, branding, landing_content, trial_expires_at, billing_exempt')
      .single();

    if (updateError || !updatedTenant) {
      return res.status(502).json({
        error: 'Failed to persist branding asset',
        details: updateError?.message ?? 'Unknown error',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tenant: updatedTenant,
        asset: {
          assetType: parsed.data.assetType,
          publicUrl,
          bucketName,
          storagePath,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
