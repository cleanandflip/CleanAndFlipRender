import { detectEnvironment } from './environment';

/**
 * Security Configuration and Validation
 */

export interface SecurityConfig {
  sessionSecret: string;
  jwtSecret?: string;
  encryptionKey?: string;
  forceSSL: boolean;
  bcryptRounds: number;
  passwordMinLength: number;
  enableCors: boolean;
  corsOrigins: string[];
  rateLimitEnabled: boolean;
}

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const environment = detectEnvironment();
  
  const baseConfig = {
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    bcryptRounds: environment === 'production' ? 12 : 10,
    passwordMinLength: 8,
    enableCors: true,
    rateLimitEnabled: true,
  };
  
  if (environment === 'production') {
    return {
      ...baseConfig,
      forceSSL: process.env.FORCE_SSL !== 'false',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    };
  } else {
    return {
      ...baseConfig,
      forceSSL: false,
      corsOrigins: ['http://localhost:3000', 'http://localhost:5000'],
    };
  }
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const environment = detectEnvironment();
  const config = getSecurityConfig();
  
  // Session secret validation
  if (!config.sessionSecret || config.sessionSecret === 'dev-session-secret-change-in-production') {
    if (environment === 'production') {
      errors.push('SESSION_SECRET must be set and not use default value in production');
    }
  }
  
  if (config.sessionSecret && config.sessionSecret.length < 32) {
    errors.push('SESSION_SECRET should be at least 32 characters long');
  }
  
  // Production-specific validations
  if (environment === 'production') {
    // SSL validation
    if (!config.forceSSL) {
      errors.push('SSL should be enabled in production (FORCE_SSL=true)');
    }
    
    // JWT secret validation
    if (config.jwtSecret && config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters long');
    }
    
    // Encryption key validation
    if (config.encryptionKey && config.encryptionKey.length < 32) {
      errors.push('ENCRYPTION_KEY should be at least 32 characters long');
    }
    
    // Developer credentials will be migrated from development database
    console.log('ℹ️  Developer credentials will be migrated from development database');
    
    // Service keys validation
    const requiredServices = [
      'STRIPE_SECRET_KEY',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'RESEND_API_KEY'
    ];
    
    for (const service of requiredServices) {
      if (!process.env[service]) {
        errors.push(`${service} is required for production`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate secure session secret
 */
export function generateSessionSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Generate JWT secret
 */
export function generateJWTSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Generate encryption key
 */
export function generateEncryptionKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getSecurityConfig();
  
  if (password.length < config.passwordMinLength) {
    errors.push(`Password must be at least ${config.passwordMinLength} characters long`);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log security status
 */
export function logSecurityStatus() {
  const config = getSecurityConfig();
  const validation = validateSecurityConfig();
  const environment = detectEnvironment();
  
  console.log('Security Configuration:');
  console.log(`  Environment: ${environment.toUpperCase()}`);
  console.log(`  Force SSL: ${config.forceSSL}`);
  console.log(`  BCrypt Rounds: ${config.bcryptRounds}`);
  console.log(`  Rate Limiting: ${config.rateLimitEnabled}`);
  console.log(`  CORS Enabled: ${config.enableCors}`);
  console.log(`  CORS Origins: ${config.corsOrigins.length} configured`);
  
  if (validation.errors.length > 0) {
    console.warn('Security Warnings:');
    validation.errors.forEach(error => console.warn(`  ⚠️  ${error}`));
  }
  
  if (!validation.isValid && environment === 'production') {
    throw new Error('Security validation failed for production environment');
  }
  
  console.log('✅ Security configuration validated');
}

export default {
  getSecurityConfig,
  validateSecurityConfig,
  generateSessionSecret,
  generateJWTSecret,
  generateEncryptionKey,
  validatePasswordStrength,
  logSecurityStatus
};