import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no definido");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shops")
      .select("id,name,slug,billing_exempt")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, error: { message: "Tenant no encontrado" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        billingExempt: Boolean(data.billing_exempt),
        landingUrl: `/landing/${data.slug}`,
        portalUrl: `/portal`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}
