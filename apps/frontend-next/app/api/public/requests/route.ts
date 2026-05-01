import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no definido");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

async function getDefaultBranchId(supabase: ReturnType<typeof createServiceClient>, tenantId: string) {
  const { data } = await supabase.from("branches").select("id").eq("tenant_id", tenantId).order("created_at", { ascending: true }).limit(1);
  return data?.[0]?.id || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantSlug = String(body.tenantSlug || "").trim();
    if (!tenantSlug) {
      return NextResponse.json({ success: false, error: { message: "tenantSlug es obligatorio" } }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: tenant, error: tenantError } = await supabase.from("shops").select("id,name,slug").eq("slug", tenantSlug).maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return NextResponse.json({ success: false, error: { message: "Tenant no encontrado" } }, { status: 404 });
    }

    const branchId = (await getDefaultBranchId(supabase, tenant.id)) || null;
    const customerId = randomUUID();
    const orderId = randomUUID();
    const folio = `SO-${tenant.slug.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-8)}`;

    const customerInsert = await supabase.from("customers").insert({
      id: customerId,
      tenant_id: tenant.id,
      branch_id: branchId,
      full_name: String(body.fullName || "").trim(),
      email: String(body.email || "").trim(),
      phone: body.phone ? String(body.phone).trim() : null,
      created_at: new Date().toISOString()
    }).select("*").single();

    if (customerInsert.error) throw customerInsert.error;

    const orderInsert = await supabase.from("service_orders").insert({
      id: orderId,
      tenant_id: tenant.id,
      branch_id: branchId,
      folio,
      customer_id: customerId,
      status: "solicitud",
      device_type: String(body.deviceType || "").trim(),
      device_brand: body.deviceBrand ? String(body.deviceBrand).trim() : null,
      device_model: body.deviceModel ? String(body.deviceModel).trim() : null,
      reported_issue: String(body.reportedIssue || "").trim(),
      estimated_cost: body.estimatedCost ? Number(body.estimatedCost) : null,
      notes: body.notes ? String(body.notes).trim() : null,
      reception_checklist: null,
      reception_photo_base64: null,
      source_quote_folio: null,
      promised_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select("*").single();

    if (orderInsert.error) throw orderInsert.error;

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        },
        customer: customerInsert.data,
        serviceOrder: orderInsert.data,
        portalUrl: `/portal?folio=${encodeURIComponent(folio)}`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}
