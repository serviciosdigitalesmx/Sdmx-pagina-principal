declare namespace NodeJS {
  interface ProcessEnv {
    // API CORS configuration
    CORS_ALLOWED_ORIGINS?: string; // comma‑separated list of allowed origins
    BASE_DOMAIN?: string; // comma‑separated list of base domains for wildcard subdomains
    // Existing variables
    PORT?: string;
    API_NAME?: string;
    JWT_SECRET?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    APP_URL?: string;
  }
}
