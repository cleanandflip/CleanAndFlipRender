#!/usr/bin/env tsx

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
// @ts-ignore
global.WebSocket = ws;

const DEV_URL = process.env.DEV_DATABASE_URL!;

async function assignDeveloperRoles() {
  console.log('🔧 Assigning developer roles to admin users...');
  
  const pool = new Pool({ connectionString: DEV_URL });
  
  try {
    // Update users with Gmail or Replit emails to developer role
    const result = await pool.query(`
      UPDATE users 
      SET role = 'developer', updated_at = NOW() 
      WHERE (email ILIKE '%@gmail.com' OR email ILIKE '%@replit.com' OR email ILIKE '%admin%') 
      AND role != 'developer'
      RETURNING id, email, role, first_name, last_name;
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No users found to update or all users already have developer role');
    } else {
      console.log(`✅ Updated ${result.rows.length} users to developer role:`);
      result.rows.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
      });
    }
    
    // Show all current users and their roles
    console.log('\n📋 Current user roles:');
    const allUsers = await pool.query(`
      SELECT id, email, role, first_name, last_name, auth_provider 
      FROM users 
      ORDER BY created_at DESC;
    `);
    
    allUsers.rows.forEach(user => {
      console.log(`  ${user.role.padEnd(10)} | ${user.email.padEnd(30)} | ${user.first_name || 'N/A'} ${user.last_name || ''}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to assign developer roles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
assignDeveloperRoles().catch(console.error);

export { assignDeveloperRoles };