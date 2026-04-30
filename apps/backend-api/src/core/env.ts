import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_BASE_URL: z.string().url().optional(),
  MERCADOPAGO_PUBLIC_KEY: z.string().optional(),
  MERCADOPAGO_SUPPORT_PHONE: z.string().optional(),
  MERCADOPAGO_WEBHOOK_BASE_URL: z.string().url().optional(),
  SRFIX_INTERNAL_API_KEY: z.string().optional(),
  API_VERSION: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ORDER_DOCUMENTS_BUCKET: z.string().optional(),
  EVIDENCE_IMAGES_BUCKET: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().optional()
});

export const env = envSchema.parse(process.env);
