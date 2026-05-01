import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildSimplePdf } from "@/lib/pdf";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no definido");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function formatDate(value?: string | null): string {
  if (!value) return "No definido";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-MX");
}

export async function GET(_: Request, context: { params: Promise<{ folio: string }> }) {
  try {
    const { folio } = await context.params;
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("service_orders")
      .select("folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,tenant_id")
      .eq("folio", folio)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ success: false, error: { message: "Folio no encontrado" } }, { status: 404 });
    }

    const lines = [
      { text: "Fixi - Orden de Servicio", size: 20, bold: true },
      { text: `Folio: ${order.folio}`, size: 14, bold: true },
      { text: `Estado: ${order.status}`, size: 12 },
      { text: `Equipo: ${[order.device_type, order.device_brand, order.device_model].filter(Boolean).join(" ") || "No definido"}`, size: 12 },
      { text: `Falla reportada: ${order.reported_issue || "No definida"}`, size: 12 },
      { text: `Entrega estimada: ${formatDate(order.promised_date)}`, size: 12 },
      { text: `Última actualización: ${formatDate(order.updated_at)}`, size: 12 },
      { text: `Tenant: ${order.tenant_id}`, size: 10 }
    ];

    const pdf = buildSimplePdf(lines);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="orden-${order.folio}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}
