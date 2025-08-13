#!/usr/bin/env ts-node

/**
 * SSOT Address System QA Test Script
 * Automated testing of the Single Source of Truth address system
 */

import { db } from '../server/db';
import { users, addresses } from '../shared/schema';
import { eq, count } from 'drizzle-orm';
import chalk from 'chalk';

interface QAResult {
  test: string;
  passed: boolean;
  details?: any;
  error?: string;
}

const results: QAResult[] = [];

function logTest(test: string, passed: boolean, details?: any, error?: string) {
  results.push({ test, passed, details, error });
  const status = passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
  console.log(`${status} ${test}`);
  if (details) console.log(`   ${chalk.gray(JSON.stringify(details))}`);
  if (error) console.log(`   ${chalk.red(`Error: ${error}`)}`);
}

async function runQATests() {
  console.log(chalk.blue('\n🧪 SSOT Address System QA Tests\n'));
  console.log(chalk.yellow('Testing database state after clean wipe...'));

  try {
    // Test 1: Verify clean state
    const userCount = await db.select({ count: count() }).from(users);
    logTest('Database clean state - users', userCount[0].count === 0, { userCount: userCount[0].count });

    const addressCount = await db.select({ count: count() }).from(addresses);
    logTest('Database clean state - addresses', addressCount[0].count === 0, { addressCount: addressCount[0].count });

    // Test 2: Check schema consistency
    const schemaCheck = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      AND column_name IN ('first_name', 'last_name', 'street', 'city', 'state', 'zip_code', 'is_local', 'is_default')
      ORDER BY column_name
    `);
    
    const requiredFields = ['city', 'first_name', 'is_default', 'is_local', 'last_name', 'state', 'street', 'zip_code'];
    const actualFields = schemaCheck.rows.map((r: any) => r.column_name).sort();
    const hasAllFields = requiredFields.every(field => actualFields.includes(field));
    
    logTest('SSOT Schema - required fields present', hasAllFields, { 
      required: requiredFields, 
      actual: actualFields 
    });

    // Test 3: Check NOT NULL constraints
    const notNullFields = schemaCheck.rows.filter((r: any) => 
      ['first_name', 'last_name', 'street', 'city', 'state'].includes(r.column_name) && r.is_nullable === 'NO'
    );
    logTest('SSOT Schema - NOT NULL constraints', notNullFields.length === 5, { 
      notNullFields: notNullFields.map((f: any) => f.column_name) 
    });

    // Test 4: Check user profile_address_id field exists
    const userSchemaCheck = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'profile_address_id'
    `);
    logTest('User schema - profile_address_id field', userSchemaCheck.rows.length === 1);

    // Test 5: Check indexes exist
    const indexCheck = await db.execute(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'addresses' 
      AND indexname LIKE '%addresses%'
    `);
    const hasIndexes = indexCheck.rows.length > 0;
    logTest('SSOT Schema - indexes present', hasIndexes, { 
      indexes: indexCheck.rows.map((r: any) => r.indexname) 
    });

  } catch (error) {
    logTest('Database connection', false, null, error instanceof Error ? error.message : 'Unknown error');
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n${chalk.blue('=')} Summary ${'='.repeat(50)}`);
  console.log(`${chalk.green(`Passed: ${passed}`)} / ${chalk.blue(`Total: ${total}`)}`);
  
  if (passed === total) {
    console.log(chalk.green('\n🎉 All SSOT QA tests passed! System ready for user testing.\n'));
  } else {
    console.log(chalk.red('\n❌ Some tests failed. Review the issues above.\n'));
    process.exit(1);
  }
}

if (require.main === module) {
  runQATests().catch(console.error);
}

export { runQATests };