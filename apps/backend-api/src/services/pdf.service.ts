import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';
import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession } from './context.js';

export class PdfService {
  // Generate a simple PDF for a service order, embedding evidence images.
  async generateOrderPdf(token: string, serviceOrderId: string): Promise<Uint8Array> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);

    const rows = await supabase.query<any[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
    const order = rows && rows[0] ? rows[0] : null;
    if (!order) throw new Error('Orden no encontrada');

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 40;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(`Folio: ${order.folio || order.id}`, { x: margin, y: height - margin - 10, size: 12, font });
    page.drawText(`Cliente: ${order.customer_name || order.customer_id || 'N/A'}`, { x: margin, y: height - margin - 30, size: 11, font });
    page.drawText(`Total estimado: ${order.estimated_cost ?? '0.00'}`, { x: margin, y: height - margin - 50, size: 11, font });

    // Try to embed evidence images if provided in evidence_metadata
    const evidence: any[] = order.evidence_metadata || [];
    let y = height - margin - 90;

    for (const item of evidence.slice(0, 6)) {
      try {
        // Expect item.path or item.file_path
        const filePath = item.path || item.file_path || item.key || item;
        if (!filePath) continue;
        // Create signed URL for tenant-scoped bucket
        const bucket = 'evidences';
        const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(`${tenantId}/${filePath}`.replace(/^\/+/, ''), 120);
        if (!signedData || !signedData.signedUrl) continue;
        const res = await fetch(signedData.signedUrl);
        const arrayBuffer = await res.arrayBuffer();
        const img = await pdfDoc.embedJpg(new Uint8Array(arrayBuffer)).catch(async () => {
          return pdfDoc.embedPng(new Uint8Array(arrayBuffer));
        });
        const imgDims = img.scale(0.5);
        page.drawImage(img, { x: margin, y: y - imgDims.height, width: imgDims.width, height: imgDims.height });
        y -= imgDims.height + 10;
        if (y < 150) {
          // new page
          y = height - margin - 10;
          page = pdfDoc.addPage();
        }
      } catch (e) {
        // skip failed images but continue
        continue;
      }
    }

    const bytes = await pdfDoc.save();
    return bytes;
  }
}

export const pdfService = new PdfService();
