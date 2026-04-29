import PDFDocument from "pdfkit";
import { compressPdfPreviewImage } from "./image.js";

export type OrderPdfKind = "ingreso" | "diagnostico" | "presupuesto" | "entrega";

export type OrderPdfOrder = {
  folio: string;
  status: string;
  vehicle_plate: string;
  device_type?: string | null;
  device_brand?: string | null;
  device_model?: string | null;
  accessories?: string | null;
  reported_failure?: string | null;
  diagnosis?: string | null;
  internal_notes?: string | null;
  public_notes?: string | null;
  estimated_cost?: number | null;
  final_cost?: number | null;
  payment_registered?: boolean | null;
  promised_date?: string | null;
  completion_date?: string | null;
  delivery_date?: string | null;
  photos_urls?: string[] | null;
  created_at: string;
  customer?: { full_name?: string | null; phone?: string | null };
};

export type OrderPdfChecklistItem = { label: string; checked?: boolean | null; sort_order?: number | null };

export type OrderPdfTenantSettings = {
  portal_title?: string | null;
  portal_subtitle?: string | null;
  portal_description?: string | null;
  website_title?: string | null;
  website_subtitle?: string | null;
  website_cta?: string | null;
  pdf_ingreso_title?: string | null;
  pdf_diagnostico_title?: string | null;
  pdf_presupuesto_title?: string | null;
  pdf_entrega_title?: string | null;
  pdf_footer_note?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
};

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    in_progress: "En progreso",
    waiting_parts: "Esperando refacción",
    done: "Lista",
    canceled: "Cancelada"
  };
  return labels[status] ?? status;
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch image: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function renderCommonFields(doc: PdfDoc, order: OrderPdfOrder) {
  doc.fontSize(11).text(`Cliente: ${order.customer?.full_name || "-"}`);
  doc.text(`Telefono: ${order.customer?.phone || "-"}`);
  doc.text(`Estado: ${statusLabel(order.status)}`);
  doc.text(`Placa: ${order.vehicle_plate || "-"}`);
  doc.text(`Dispositivo: ${[order.device_type, order.device_brand, order.device_model].filter(Boolean).join(" ") || "-"}`);
  doc.text(`Accesorios: ${order.accessories || "-"}`);
  doc.text(`Fecha de ingreso: ${new Date(order.created_at).toLocaleString()}`);
}

function renderKindSection(doc: PdfDoc, order: OrderPdfOrder, kind: OrderPdfKind, settings?: OrderPdfTenantSettings) {
  if (kind === "diagnostico") {
    doc.fontSize(13).text(settings?.pdf_diagnostico_title || "Diagnóstico y notas");
    doc.fontSize(11).text(`Falla reportada: ${order.reported_failure || "-"}`);
    doc.text(`Diagnóstico: ${order.diagnosis || "-"}`);
    doc.text(`Notas internas: ${order.internal_notes || "-"}`);
    doc.text(`Notas públicas: ${order.public_notes || "-"}`);
    return;
  }

  if (kind === "presupuesto") {
    doc.fontSize(13).text(settings?.pdf_presupuesto_title || "Presupuesto");
    doc.fontSize(11).text(`Costo estimado: ${order.estimated_cost ?? "-"}`);
    doc.text(`Costo final: ${order.final_cost ?? "-"}`);
    doc.text(`Pago registrado: ${order.payment_registered ? "Sí" : "No"}`);
    doc.text(`Diagnóstico: ${order.diagnosis || "-"}`);
    return;
  }

  if (kind === "entrega") {
    doc.fontSize(13).text(settings?.pdf_entrega_title || "Entrega");
    doc.fontSize(11).text(`Estado: ${statusLabel(order.status)}`);
    doc.text(`Fecha promesa: ${order.promised_date || "-"}`);
    doc.text(`Fecha finalización: ${order.completion_date || "-"}`);
    doc.text(`Fecha entrega: ${order.delivery_date || "-"}`);
    doc.text(`Pago registrado: ${order.payment_registered ? "Sí" : "No"}`);
    doc.text(`Notas públicas: ${order.public_notes || "-"}`);
    return;
  }

  if (kind === "ingreso") {
    doc.fontSize(13).text(settings?.pdf_ingreso_title || "Intake de ingreso");
    doc.fontSize(11).text(`Falla reportada: ${order.reported_failure || "-"}`);
    doc.text(`Notas públicas: ${order.public_notes || "-"}`);
    return;
  }

  doc.fontSize(13).text("Checklist de ingreso");
}

export async function buildOrderPdfBuffer(
  order: OrderPdfOrder,
  checklistItems: OrderPdfChecklistItem[],
  kind: OrderPdfKind,
  settings?: OrderPdfTenantSettings
) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(settings?.website_title ? `${settings.website_title} · Orden ${order.folio}` : `Orden de ${kind} ${order.folio}`);
    if (settings?.website_subtitle) {
      doc.moveDown(0.25);
      doc.fontSize(10).fillColor("#666666").text(settings.website_subtitle);
      doc.fillColor("#000000");
    }
    doc.moveDown(0.5);
    renderCommonFields(doc, order);
    doc.moveDown();
    renderKindSection(doc, order, kind, settings);

    if (checklistItems.length) {
      doc.moveDown(0.5);
      checklistItems.forEach((item, index) => {
        doc.fontSize(11).text(`${index + 1}. [${item.checked ? "x" : " "}] ${item.label}`);
      });
    }

    const firstPhoto = Array.isArray(order.photos_urls) ? order.photos_urls[0] : undefined;
    if (firstPhoto) {
      doc.addPage();
      doc.fontSize(13).text("Foto de ingreso");
      doc.moveDown();
      fetchImageBuffer(firstPhoto)
        .then((imageBuffer) => {
          compressPdfPreviewImage(imageBuffer)
            .then((compressedImage) => {
              doc.image(compressedImage, { fit: [500, 400], align: "center", valign: "center" });
              if (settings?.pdf_footer_note) {
                doc.moveDown();
                doc.fontSize(9).fillColor("#666666").text(settings.pdf_footer_note);
                doc.fillColor("#000000");
              }
              doc.end();
            })
            .catch(() => {
              doc.image(imageBuffer, { fit: [500, 400], align: "center", valign: "center" });
              doc.end();
            });
        })
        .catch(() => {
          doc.fontSize(10).text(firstPhoto);
          doc.end();
        });
      return;
    }

    doc.end();
  });
}
