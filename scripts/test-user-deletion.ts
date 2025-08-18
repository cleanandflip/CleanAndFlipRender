/* Test user deletion after fixing foreign key constraints */
import 'dotenv/config';
import { Client } from 'pg';

const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in env.');
  process.exit(1);
}

async function testUserDeletion() {
  const client = new Client({ 
    connectionString: DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  await client.connect();
  
  try {
    console.log('🧪 Testing user deletion with cascading constraints...');
    
    // Create a test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, role)
      VALUES ('test-deletion@example.com', 'Test', 'User', 'user')
      RETURNING id
    `);
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Created test user: ${userId}`);
    
    // Create test address for the user
    const addressResult = await client.query(`
      INSERT INTO addresses (user_id, first_name, last_name, street1, city, state, postal_code)
      VALUES ($1, 'Test', 'User', '123 Test St', 'Test City', 'CA', '90210')
      RETURNING id
    `, [userId]);
    
    const addressId = addressResult.rows[0].id;
    console.log(`✅ Created test address: ${addressId}`);
    
    // Verify relationships exist
    const beforeCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE id = $1) as user_count,
        (SELECT COUNT(*) FROM addresses WHERE user_id = $1) as address_count
    `, [userId]);
    
    console.log('Before deletion:', beforeCheck.rows[0]);
    
    // Now test deletion (should cascade)
    const deleteResult = await client.query(`
      DELETE FROM users WHERE id = $1
    `, [userId]);
    
    console.log(`✅ Deleted user (${deleteResult.rowCount} rows affected)`);
    
    // Verify cascading worked
    const afterCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE id = $1) as user_count,
        (SELECT COUNT(*) FROM addresses WHERE user_id = $1) as address_count
    `, [userId]);
    
    console.log('After deletion:', afterCheck.rows[0]);
    
    if (afterCheck.rows[0].user_count === '0' && afterCheck.rows[0].address_count === '0') {
      console.log('✅ CASCADE DELETE working perfectly!');
    } else {
      console.log('❌ CASCADE DELETE not working properly');
      console.log('Expected: user_count=0, address_count=0');
      console.log('Got:', afterCheck.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testUserDeletion().catch(console.error);