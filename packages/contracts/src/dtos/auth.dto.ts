export interface AuthSessionDTO {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    tenant_id: string;
    tenant_slug?: string;
  };
}

export interface LoginRequestDTO {
  email: string;
  password?: string;
  tenant_slug: string;
}
