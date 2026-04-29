import { env } from "./env.js";
import { addStorageUsage } from "./storage-quota.js";
import { supabaseAdmin } from "./supabase.js";

export type OrderDocumentType = "ingreso" | "diagnostico" | "presupuesto" | "entrega";

export async function storeOrderDocument(params: {
  tenantId: string;
  orderId: string;
  folio: string;
  documentType: OrderDocumentType;
  pdfBuffer: Buffer;
}) {
  const bucket = env.ORDER_DOCUMENTS_BUCKET;
  if (!bucket) {
    throw new Error("ORDER_DOCUMENTS_BUCKET is required");
  }

  const storagePath = `${params.tenantId}/orders/${params.folio}/${params.documentType}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, params.pdfBuffer, {
    contentType: "application/pdf",
    upsert: true
  });
  if (uploadError) throw uploadError;

  const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage.from(bucket).createSignedUrl(storagePath, 60 * 60 * 24 * 30);
  if (signedUrlError) throw signedUrlError;
  await addStorageUsage(params.tenantId, params.pdfBuffer.length);
  const { error: documentError } = await supabaseAdmin
    .from("order_documents")
    .upsert(
      {
        tenant_id: params.tenantId,
        order_id: params.orderId,
        document_type: params.documentType,
        storage_path: storagePath,
        public_url: signedUrl.signedUrl,
        updated_at: new Date().toISOString()
      },
      { onConflict: "tenant_id,order_id,document_type" }
    );

  if (documentError) throw documentError;
  return { storagePath, publicUrl: signedUrl.signedUrl };
}
