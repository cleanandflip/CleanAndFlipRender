import { sql } from 'drizzle-orm';
import { users } from '../../shared/schema';

/**
 * Normalize email to lowercase and trim whitespace
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim();
}

/**
 * Create case-insensitive email condition for database queries
 */
export function createEmailCondition(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return sql`LOWER(${users.email}) = ${normalizedEmail}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.indexOf('@');
  return atIndex !== -1 ? normalized.substring(atIndex + 1) : '';
}