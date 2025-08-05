import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

async function validateStartupSchema() {
  Logger.info('🔍 Running startup schema validation...');
  
  const schemaIssues = [];
  
  // Test critical queries that were causing production errors
  const tests = [
    {
      name: 'Products subcategory column',
      query: sql`SELECT subcategory FROM products LIMIT 1`,
      critical: false // Non-critical, system can work without
    },
    {
      name: 'Users street column', 
      query: sql`SELECT street FROM users LIMIT 1`,
      critical: false // Non-critical, addresses table exists separately
    },
    {
      name: 'Users essential fields',
      query: sql`SELECT id, email, first_name, last_name FROM users LIMIT 1`,
      critical: true // Critical for authentication
    },
    {
      name: 'Products essential fields',
      query: sql`SELECT id, name, price, category_id FROM products LIMIT 1`,
      critical: true // Critical for product display
    },
    {
      name: 'Password reset tokens table',
      query: sql`SELECT id, user_id, token FROM password_reset_tokens LIMIT 1`,
      critical: true // Critical for password reset
    },
    {
      name: 'Email logs table',
      query: sql`SELECT id, to_email, status FROM email_logs LIMIT 1`,
      critical: true // Critical for email tracking
    }
  ];
  
  for (const test of tests) {
    try {
      await db.execute(test.query);
      Logger.info(`✅ ${test.name}: OK`);
    } catch (error: any) {
      if (error.code === '42703') { // Column does not exist
        const issue = `${test.name}: ${error.message}`;
        if (test.critical) {
          Logger.error(`❌ CRITICAL: ${issue}`);
          schemaIssues.push({ ...test, error: error.message, level: 'critical' });
        } else {
          Logger.warn(`⚠️  WARNING: ${issue}`);
          schemaIssues.push({ ...test, error: error.message, level: 'warning' });
        }
      } else {
        Logger.error(`❌ Database error for ${test.name}:`, error.message);
        schemaIssues.push({ ...test, error: error.message, level: 'error' });
      }
    }
  }
  
  // Check table relationships
  try {
    const relationshipTest = await db.execute(sql`
      SELECT p.id, p.name, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LIMIT 1
    `);
    Logger.info('✅ Product-Category relationship: OK');
  } catch (error: any) {
    Logger.error('❌ Product-Category relationship failed:', error.message);
    schemaIssues.push({
      name: 'Product-Category relationship',
      error: error.message,
      level: 'critical'
    });
  }
  
  // Summary
  const criticalIssues = schemaIssues.filter(issue => issue.level === 'critical');
  const warnings = schemaIssues.filter(issue => issue.level === 'warning');
  
  if (criticalIssues.length > 0) {
    Logger.error(`💥 ${criticalIssues.length} CRITICAL schema issues detected:`);
    criticalIssues.forEach(issue => Logger.error(`   - ${issue.name}: ${issue.error}`));
    Logger.error('   🚨 Application may not function correctly!');
  } else if (warnings.length > 0) {
    Logger.warn(`⚠️  ${warnings.length} schema warnings detected:`);
    warnings.forEach(issue => Logger.warn(`   - ${issue.name}: ${issue.error}`));
    Logger.warn('   📝 Consider running migrations to resolve warnings');
  } else {
    Logger.info('✅ All schema validations passed - system is healthy');
  }
  
  return {
    healthy: criticalIssues.length === 0,
    issues: schemaIssues,
    criticalCount: criticalIssues.length,
    warningCount: warnings.length
  };
}

export { validateStartupSchema };