import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().default('dev-secret-key'),
  REDIS_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export function validateEnvironmentVariables() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    return envSchema.parse({});
  }
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    hasDatabase: !!process.env.DATABASE_URL,
    hasRedis: !!process.env.REDIS_URL,
  };
}