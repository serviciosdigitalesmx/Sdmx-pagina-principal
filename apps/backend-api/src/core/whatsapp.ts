export type WhatsAppMessageInput = {
  phone?: string | null;
  message: string;
};

export function buildWhatsAppUrl({ phone, message }: WhatsAppMessageInput) {
  const normalizedPhone = phone?.replace(/\D/g, "") ?? "";
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildOrderStatusMessage(folio: string, portalUrl: string, statusLabel: string) {
  return `Hola, tu orden ${folio} cambió a "${statusLabel}". Sigue su avance aquí: ${portalUrl}`;
}
