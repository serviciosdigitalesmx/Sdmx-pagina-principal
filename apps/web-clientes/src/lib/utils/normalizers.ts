import type { BackendOrderResponse, NormalizedAttachment, NormalizedDocument, NormalizedEvent, NormalizedMessage, NormalizedOrder, NormalizedOrderDetail, NormalizedTimelineEvent } from "../types";

export function normalizeOrderDetail(raw: BackendOrderResponse["data"]): NormalizedOrderDetail {
  return {
    order: normalizeOrder(raw.order),
    orderStatusLabel: raw.order.status,
    timeline: normalizeTimeline(raw.timeline ?? []),
    pdfAttachment: raw.pdf_attachment ? normalizeDocument(raw.pdf_attachment) : undefined,
    attachments: normalizeAttachments(raw.attachments ?? []),
    documents: normalizeDocuments(raw.documents ?? []),
    events: normalizeEvents(raw.events ?? []),
    messages: normalizeMessages(raw.messages ?? []),
  };
}

function normalizeOrder(order: BackendOrderResponse["data"]["order"]): NormalizedOrder {
  const deviceInfo = order.device_info ?? {};
  return {
    folio: order.folio,
    status: order.status,
    statusLabel: order.status,
    deviceType: String(deviceInfo.type ?? "No disponible"),
    deviceBrand: String(deviceInfo.brand ?? "No disponible"),
    deviceModel: String(deviceInfo.model ?? "No disponible"),
    serialNumber: deviceInfo.serial_number ?? order.serial_number ?? undefined,
    problemDescription: String(order.problem_description ?? "No disponible"),
    createdAt: new Date(order.created_at ?? Date.now()),
    updatedAt: new Date(order.updated_at ?? order.created_at ?? Date.now()),
    promisedDate: order.promised_date ? new Date(order.promised_date) : undefined,
    customerName: deviceInfo.customer_name ?? undefined,
    customerPhone: deviceInfo.customer_phone ?? undefined,
    customerEmail: deviceInfo.customer_email ?? undefined,
  };
}

function normalizeTimeline(events: BackendOrderResponse["data"]["timeline"]): NormalizedTimelineEvent[] {
  return events.map((event, index) => ({
    id: `${event.label}-${index}`,
    label: event.label,
    status: event.status,
    note: event.note,
    date: new Date(),
  }));
}

function normalizeAttachments(attachments: BackendOrderResponse["data"]["attachments"]): NormalizedAttachment[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.file_name,
    url: attachment.public_url ?? "",
    type: attachment.file_type.startsWith("image") ? "image" : attachment.file_type.startsWith("video") ? "video" : "document",
    mimeType: attachment.mime_type,
    source: attachment.source,
    date: new Date(attachment.created_at),
  }));
}

function normalizeDocuments(documents: BackendOrderResponse["data"]["documents"]): NormalizedDocument[] {
  return documents.map((document) => ({
    id: document.id,
    name: document.file_name,
    url: document.public_url ?? "",
    type: document.file_type === "invoice" || document.file_type === "warranty" || document.file_type === "diagnostic" ? document.file_type : "other",
    date: new Date(document.created_at),
  }));
}

function normalizeDocument(document: NonNullable<BackendOrderResponse["data"]["pdf_attachment"]>): NormalizedDocument {
  return {
    id: document.fileName ?? document.label,
    name: document.label,
    url: document.url,
    type: "invoice",
    date: new Date(),
  };
}

function normalizeEvents(events: BackendOrderResponse["data"]["events"]): NormalizedEvent[] {
  return events.map((event) => ({
    id: event.id,
    type: event.event_type,
    description: event.note ?? event.event_type,
    date: new Date(event.created_at),
  }));
}

function normalizeMessages(messages: BackendOrderResponse["data"]["messages"]): NormalizedMessage[] {
  return messages.map((message) => ({
    id: message.id,
    from: "technician",
    content: message.note ?? "",
    read: true,
    date: new Date(message.created_at),
  }));
}
