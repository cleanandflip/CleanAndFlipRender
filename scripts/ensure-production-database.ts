import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function ensureProductionDatabase() {
  console.log('='.repeat(60));
  console.log('PRODUCTION DATABASE SETUP AND VERIFICATION');
  console.log('='.repeat(60));
  
  const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in environment variables');
    process.exit(1);
  }
  
  console.log('Using database:', new URL(databaseUrl).hostname);
  
  const sqlClient = neon(databaseUrl);
  const db = drizzle(sqlClient);
  
  try {
    // Step 1: Check current state
    console.log('\n1. CHECKING CURRENT DATABASE STATE...');
    
    const dbInfo = await db.execute(sql`
      SELECT current_database() as db, current_user as user, version() as version
    `);
    console.log(`Connected to: ${dbInfo.rows[0].db} as ${dbInfo.rows[0].user}`);
    
    // Check if password_reset_tokens table exists
    let tokenTableExists = false;
    try {
      await db.execute(sql`SELECT 1 FROM password_reset_tokens LIMIT 1`);
      tokenTableExists = true;
      console.log('✅ password_reset_tokens table exists');
    } catch (error) {
      console.log('❌ password_reset_tokens table missing');
    }
    
    // Step 2: Create missing table if needed
    if (!tokenTableExists) {
      console.log('\n2. CREATING password_reset_tokens TABLE...');
      
      await db.execute(sql`
        CREATE TABLE password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created password_reset_tokens table');
      
      // Create indexes
      await db.execute(sql`CREATE INDEX idx_prt_token ON password_reset_tokens(token)`);
      await db.execute(sql`CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id)`);
      await db.execute(sql`CREATE INDEX idx_prt_expires ON password_reset_tokens(expires_at)`);
      console.log('✅ Created indexes for password_reset_tokens');
      
      // Add foreign key constraint if users table exists
      try {
        await db.execute(sql`
          ALTER TABLE password_reset_tokens 
          ADD CONSTRAINT fk_password_reset_tokens_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✅ Added foreign key constraint');
      } catch (fkError) {
        console.log('⚠️ Could not add foreign key constraint (users table may not exist)');
      }
    }
    
    // Step 3: Verify users table and data
    console.log('\n3. CHECKING USERS TABLE...');
    
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`Users in database: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count === 0 || userCount.rows[0].count === '0') {
      console.log('⚠️ No users found - you may need to create test users');
    } else {
      const sampleUsers = await db.execute(sql`
        SELECT id, email, first_name, role 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log('Sample users:');
      sampleUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name}, ${user.role || 'user'})`);
      });
    }
    
    // Step 4: Test password reset functionality
    console.log('\n4. TESTING PASSWORD RESET FUNCTIONALITY...');
    
    const testEmails = ['cleanandflipyt@gmail.com', 'test3@gmail.com'];
    for (const email of testEmails) {
      const user = await db.execute(sql`
        SELECT id, email, first_name 
        FROM users 
        WHERE LOWER(TRIM(email)) = ${email.toLowerCase()}
        LIMIT 1
      `);
      
      if (user.rows.length > 0) {
        console.log(`✅ ${email} - Ready for password reset`);
      } else {
        console.log(`❌ ${email} - User not found`);
      }
    }
    
    // Step 5: Final verification
    console.log('\n5. FINAL VERIFICATION...');
    
    const finalCheck = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM password_reset_tokens) as token_count,
        current_database() as database,
        current_user as db_user
    `);
    
    const result = finalCheck.rows[0];
    console.log(`✅ Database: ${result.database}`);
    console.log(`✅ Users: ${result.user_count}`);
    console.log(`✅ Password reset tokens: ${result.token_count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PRODUCTION DATABASE SETUP COMPLETE');
    console.log('The database is ready for password reset functionality');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR SETTING UP PRODUCTION DATABASE:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

ensureProductionDatabase();