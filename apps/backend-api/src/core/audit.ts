import { supabaseAdmin } from "./supabase.js";

export type AuditEventInput = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(input: AuditEventInput) {
  const { error } = await supabaseAdmin.from("audit_events").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {}
  });

  if (error) {
    console.error("[audit] failed to persist event", error.message);
  }
}
