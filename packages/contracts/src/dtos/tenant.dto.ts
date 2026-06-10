export interface TenantDTO {
  id: string;
  slug: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
