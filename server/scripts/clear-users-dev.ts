/**
 * Development utility to clear test users and addresses
 * WARNING: Only run in development environment
 */

import { db } from '../db';
import { users, addresses } from '@shared/schema';
import { eq, or, like, sql } from 'drizzle-orm';

async function clearDevUsers() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run in production environment!');
    process.exit(1);
  }

  try {
    console.log('🧹 Clearing development users and addresses...');

    // Clear test users (emails containing test patterns)
    const testPatterns = ['@test.local', 'seed+', '+test@', 'dev+', '@example.'];
    
    for (const pattern of testPatterns) {
      const deletedUsers = await db
        .delete(users)
        .where(like(users.email, `%${pattern}%`))
        .returning({ email: users.email });
      
      if (deletedUsers.length > 0) {
        console.log(`   Deleted ${deletedUsers.length} users matching "${pattern}"`);
      }
    }

    // Clear orphaned addresses (addresses with no corresponding user)
    const orphanedAddresses = await db.execute(sql`
      DELETE FROM addresses 
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);
    
    if (orphanedAddresses.rowCount && orphanedAddresses.rowCount > 0) {
      console.log(`   Cleaned up ${orphanedAddresses.rowCount} orphaned addresses`);
    }

    console.log('✅ Development cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the cleanup
clearDevUsers();