import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
// Nota: Asegúrate de que la lógica de buildSimplePdf esté disponible en el backend
// Si la tienes en un paquete compartido o lib, impórtala correctamente.
// Aquí simulamos la lógica basándonos en tu código anterior.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

function formatDate(value?: string | null): string {
  if (!value) return "No definido";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(date);
}

// Simulador de buildSimplePdf (Deberás copiar tu lib/pdf real aquí o importarla)
// Si usas pdfkit o similar en tu lib original, instálalo en el backend-api.
async function buildPdfBuffer(lines: any[]) {
    // Aquí invocarías tu lógica real de '@/lib/pdf'
    // Por ahora, asumimos que exportarás esa función a una utilidad en el backend.
    return Buffer.from("PDF_CONTENT_STUB"); 
}

export const generateOrderPdf = async (req: Request, res: Response) => {
  try {
    const { folio } = req.params;

    const { data: order, error } = await supabase
      .from("service_orders")
      .select("folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,tenant_id")
      .eq("folio", folio)
      .maybeSingle();

    if (error) throw error;
    if (!order) return res.status(404).json({ error: "Folio no encontrado" });

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

    // IMPORTANTE: Asegúrate de copiar tu archivo lib/pdf.ts a apps/backend-api/src/lib/pdf.ts
    // O usar una librería como pdfkit/jspdf aquí.
    const { buildSimplePdf } = require('../lib/pdf');
    const pdfBuffer = buildSimplePdf(lines);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orden-${order.folio}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    
    return res.send(Buffer.from(pdfBuffer));

  } catch (error: any) {
    console.error('[PDF Error]:', error.message);
    return res.status(400).json({ error: error.message });
  }
};
