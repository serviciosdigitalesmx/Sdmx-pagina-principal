import { Request, Response } from 'express';
import { pdfService } from '../services/pdf.service.js';
import { notificationsService } from '../services/notifications.service.js';

export async function generateOrderPdfAuth(req: Request & { tenantId?: string; session?: any }, res: Response) {
  try {
    const accessToken = String(req.headers['x-access-token'] || req.headers.authorization || '');
    const id = req.params.id;
    const bytes = await pdfService.generateOrderPdf(accessToken as string, id);
    const buf = Buffer.from(bytes);
    res.setHeader('Content-Type', 'application/pdf');
    // Force download so browser saves file instead of inline preview
    res.setHeader('Content-Disposition', `attachment; filename="orden-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Length', String(buf.length));
    return res.send(buf);
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: e.message } });
  }
}

export async function getWhatsAppLink(req: Request & { tenantId?: string; session?: any }, res: Response) {
  try {
    const accessToken = String(req.headers['x-access-token'] || req.headers.authorization || '');
    const id = req.params.id;
    const phone = req.query.phone as string | undefined;
    const template = req.query.template as string | undefined;
    const url = await notificationsService.buildWhatsAppLink(accessToken as string, id, template, phone);
    return res.status(200).json({ success: true, data: { url } });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: e.message } });
  }
}
