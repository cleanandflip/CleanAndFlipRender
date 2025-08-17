import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["production","development","test"]).default("development"),
  APP_ENV: z.enum(["production","staging","development"]).default("development"),
  DATABASE_URL: z.string().url(),
  EXPECTED_DB_HOST: z.string().optional(),
  APP_BUILD_ID: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);