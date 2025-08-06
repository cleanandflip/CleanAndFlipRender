import { Logger } from '../utils/logger';

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  STRIPE_SECRET_KEY: string;
  [key: string]: string | undefined;
}

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY'
] as const;

const OPTIONAL_ENV_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY'
] as const;

export function validateEnvironmentVariables(): EnvironmentConfig {
  Logger.info('[ENV] Validating environment configuration...');
  
  const config: Partial<EnvironmentConfig> = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '5000'
  };

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      config[envVar] = value;
      Logger.info(`[ENV] ✓ ${envVar} is configured`);
    }
  }

  // Check optional variables and warn if missing
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
      warnings.push(`${envVar} not set - related features may be disabled`);
    } else {
      config[envVar] = value;
      Logger.info(`[ENV] ✓ ${envVar} is configured`);
    }
  }

  // Log warnings for missing optional variables
  if (warnings.length > 0) {
    Logger.warn('[ENV] Optional configuration warnings:');
    warnings.forEach(warning => Logger.warn(`[ENV] - ${warning}`));
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    Logger.error('[ENV] Missing required environment variables:');
    missing.forEach(variable => Logger.error(`[ENV] - ${variable}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate PORT is a valid number
  const port = parseInt(config.PORT!, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${config.PORT}. Must be a number between 1-65535`);
  }

  // Environment-specific validations
  if (config.NODE_ENV === 'production') {
    Logger.info('[ENV] Production mode - performing additional validation...');
    
    // In production, ensure we have essential services configured
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production');
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required in production');
    }
  }

  Logger.info(`[ENV] Environment validation completed successfully`);
  Logger.info(`[ENV] Running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  
  return config as EnvironmentConfig;
}

export function getEnvironmentInfo(): Record<string, any> {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memory: {
      total: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  };
}