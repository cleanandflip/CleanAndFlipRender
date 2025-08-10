/**
 * Environment Detection and Configuration
 */

export type Environment = 'development' | 'production' | 'test';

/**
 * Detect current environment using multiple methods
 */
export function detectEnvironment(): Environment {
  // Method 1: Check REPLIT_DEPLOYMENT flag
  if (process.env.REPLIT_DEPLOYMENT === 'true') {
    return 'production';
  }
  
  // Method 2: Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  
  // Default to development
  return 'development';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return detectEnvironment() === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return detectEnvironment() === 'test';
}

/**
 * Check if running in Replit deployment
 */
export function isReplitDeployment(): boolean {
  return process.env.REPLIT_DEPLOYMENT === 'true';
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig() {
  const environment = detectEnvironment();
  
  return {
    environment,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isTest: isTest(),
    isReplitDeployment: isReplitDeployment(),
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  };
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentSettings() {
  const environment = detectEnvironment();
  
  const baseSettings = {
    logLevel: environment === 'production' ? 'warn' : 'debug',
    enableDebugLogging: environment === 'development',
    enablePerformanceMonitoring: environment === 'production',
    maxRequestSize: '10mb',
    sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
  
  if (environment === 'production') {
    return {
      ...baseSettings,
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100,
      enableHttpsRedirect: true,
      trustProxy: true,
    };
  } else {
    return {
      ...baseSettings,
      corsOrigins: ['http://localhost:3000', 'http://localhost:5000'],
      rateLimitWindow: 1 * 60 * 1000, // 1 minute
      rateLimitMax: 1000,
      enableHttpsRedirect: false,
      trustProxy: false,
    };
  }
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const environment = detectEnvironment();
  
  // Required environment variables
  const requiredVars = ['DATABASE_URL'];
  
  if (environment === 'production') {
    requiredVars.push(
      'STRIPE_SECRET_KEY',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'RESEND_API_KEY'
    );
  }
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Production-specific validations
  if (environment === 'production') {
    if (process.env.DATABASE_URL?.includes('lingering-flower')) {
      errors.push('CRITICAL: Cannot use development database in production');
    }
    
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log environment status
 */
export function logEnvironmentStatus() {
  const config = getEnvironmentConfig();
  const validation = validateEnvironment();
  
  console.log('Environment Configuration:');
  console.log(`  Environment: ${config.environment.toUpperCase()}`);
  console.log(`  Node Version: ${config.nodeVersion}`);
  console.log(`  Platform: ${config.platform}`);
  console.log(`  PID: ${config.pid}`);
  console.log(`  Replit Deployment: ${config.isReplitDeployment}`);
  
  if (!validation.isValid) {
    console.error('Environment Validation Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed');
  }
  
  console.log('✅ Environment validation passed');
}

export default {
  detectEnvironment,
  isDevelopment,
  isProduction,
  isTest,
  isReplitDeployment,
  getEnvironmentConfig,
  getEnvironmentSettings,
  validateEnvironment,
  logEnvironmentStatus
};