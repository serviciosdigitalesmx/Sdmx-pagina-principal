export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactAddress?: string | null;
  branding: {
    logoUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    faviconUrl?: string | null;
  };
  config?: {
    templates?: {
      landing?: Partial<LandingContent> | null;
      portal?: Record<string, unknown> | null;
    } | null;
    labels?: Record<string, string> | null;
    statusLabels?: Record<string, string> | null;
  } | null;
}

export interface Service {
  title: string;
  description: string;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface Testimonial {
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface LandingContent {
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  contactLabel?: string;
  contactHref?: string;
  services: Service[];
  benefits?: Benefit[];
  testimonials?: Testimonial[];
  socialLinks?: SocialLink[];
  showMap?: boolean;
  mapEmbedUrl?: string;
  showVideo?: boolean;
  videoUrl?: string;
}

export interface LandingResponse {
  success: boolean;
  data: {
    tenant: Tenant;
    landingContent: LandingContent;
  };
}

export interface BackendOrderResponse {
  success: boolean;
  tenant: Tenant;
  data: {
    order: {
      id: string;
      folio: string;
      status: string;
      total_cost?: number | null;
      created_at?: string | null;
      updated_at?: string | null;
      promised_date?: string | null;
      device_info?: {
        customer_name?: string | null;
        customer_phone?: string | null;
        customer_email?: string | null;
        brand?: string | null;
        model?: string | null;
        type?: string | null;
        serial_number?: string | null;
      } | null;
      problem_description?: string | null;
      serial_number?: string | null;
      estimated_cost?: number | null;
      final_cost?: number | null;
    };
    orderStatusLabel: string;
    timeline: Array<{
      label: string;
      status: "pending" | "in_progress" | "completed";
      note: string;
    }>;
    pdf_attachment?: {
      type: "receipt_pdf";
      label: string;
      url: string;
      fileName: string | null;
      mimeType: string;
      source: "stored_url" | "inline_data_url";
    } | null;
    attachments: Array<{
      id: string;
      file_name: string;
      file_type: string;
      public_url: string | null;
      mime_type: string;
      created_at: string;
      source: string;
    }>;
    documents: Array<{
      id: string;
      file_name: string;
      file_type: string;
      public_url: string | null;
      mime_type: string;
      created_at: string;
      source: string;
    }>;
    events: Array<{
      id: string;
      event_type: string;
      previous_status?: string | null;
      new_status?: string | null;
      note?: string | null;
      actor_name?: string | null;
      created_at: string;
    }>;
    messages: Array<{
      id: string;
      note: string | null;
      actor_name?: string | null;
      created_at: string;
    }>;
  };
}

export type NormalizedTimelineEvent = {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "pending";
  note?: string;
  date: Date;
};

export type NormalizedAttachment = {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "document";
  mimeType: string;
  source: string;
  date: Date;
};

export type NormalizedDocument = {
  id: string;
  name: string;
  url: string;
  type: "invoice" | "warranty" | "diagnostic" | "other";
  date: Date;
};

export type NormalizedMessage = {
  id: string;
  from?: string;
  content: string;
  read?: boolean;
  date: Date;
};

export type NormalizedEvent = {
  id: string;
  type: string;
  description: string;
  date: Date;
};

export interface NormalizedOrder {
  folio: string;
  status: string;
  statusLabel: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber?: string;
  problemDescription: string;
  createdAt: Date;
  updatedAt: Date;
  promisedDate?: Date;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface NormalizedOrderDetail {
  order: NormalizedOrder;
  orderStatusLabel: string;
  timeline: NormalizedTimelineEvent[];
  pdfAttachment?: NormalizedDocument;
  attachments: NormalizedAttachment[];
  documents: NormalizedDocument[];
  events: NormalizedEvent[];
  messages: NormalizedMessage[];
}
