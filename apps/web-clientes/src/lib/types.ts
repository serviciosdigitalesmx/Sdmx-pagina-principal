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
    heroImageUrl?: string | null;
    coverImageUrl?: string | null;
  };
  theme_config?: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
    colors?: {
      primary?: string | null;
      secondary?: string | null;
      accent?: string | null;
      background?: string | null;
      foreground?: string | null;
      surface?: string | null;
      surfaceElevated?: string | null;
      border?: string | null;
      success?: string | null;
      warning?: string | null;
      danger?: string | null;
      muted?: string | null;
    } | null;
    typography?: {
      sans?: string | null;
      display?: string | null;
      mono?: string | null;
    } | null;
    imagery?: {
      heroImageUrl?: string | null;
      coverImageUrl?: string | null;
    } | null;
    cta?: {
      primaryRadius?: string | null;
      secondaryRadius?: string | null;
      primaryVariant?: "solid" | "outline" | "soft" | null;
      secondaryVariant?: "solid" | "outline" | "soft" | null;
      shadow?: string | null;
    } | null;
    footer?: {
      background?: string | null;
      text?: string | null;
      border?: string | null;
      compact?: boolean | null;
    } | null;
  } | null;
  config?: {
    templates?: {
      landing?: Partial<LandingContent> | null;
      portal?: Record<string, unknown> | null;
    } | null;
    fieldDefinitions?: TenantFieldDefinition[] | null;
    labels?: Record<string, string> | null;
    statusLabels?: Record<string, string> | null;
  } | null;
}

export type TenantFieldDefinition = {
  id?: string;
  entity: string;
  field_key: string;
  field_label: string;
  field_type: "text" | "textarea" | "number" | "select" | "boolean" | "date" | "money";
  required?: boolean;
  options?: Array<string | { label?: string; value?: string | number | boolean }>;
  field_order?: number;
  placeholder?: string | null;
  help_text?: string | null;
  visible?: boolean;
  validation?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

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

export interface GalleryItem {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
  type?: "image" | "video";
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LandingContent {
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription: string;
  seoTitle?: string;
  seoDescription?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  contactLabel?: string;
  contactHref?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: string;
  services: Service[];
  benefits?: Benefit[];
  testimonials?: Testimonial[];
  socialLinks?: SocialLink[];
  gallery?: GalleryItem[];
  faqs?: FaqItem[];
  aboutTitle?: string;
  aboutDescription?: string;
  showMap?: boolean;
  mapEmbedUrl?: string;
  showVideo?: boolean;
  videoUrl?: string;
  sections?: Array<{
    id: string;
    enabled?: boolean;
  }>;
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
      final_cost?: number | null;
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
