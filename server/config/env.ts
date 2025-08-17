import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["production","development","test"]).default("development"),
  APP_ENV: z.enum(["production","staging","development"]).default("development"),
  PROD_DATABASE_URL: z.string().url().optional(),
  DEV_DATABASE_URL: z.string().url().optional(),
  // Temporary backwards compatibility for deployment migration
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(10).default("dev-secret-change-in-production"),
  PORT: z.string().optional(),
  APP_BUILD_ID: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);