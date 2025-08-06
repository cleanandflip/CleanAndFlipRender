import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function exportCurrentData() {
  console.log('📤 EXPORTING CURRENT DATABASE DATA');
  console.log('='.repeat(50));
  
  try {
    // Export users
    const users = await db.execute(sql`
      SELECT id, email, first_name, last_name, password, role, created_at, updated_at
      FROM users
      ORDER BY created_at
    `);
    
    // Export products  
    const products = await db.execute(sql`
      SELECT id, name, description, price, category_id, images, condition, brand, created_at, updated_at
      FROM products
      ORDER BY created_at
    `);
    
    // Export categories
    const categories = await db.execute(sql`
      SELECT id, name, description, created_at
      FROM categories  
      ORDER BY name
    `);
    
    const exportData = {
      users: users.rows,
      products: products.rows,
      categories: categories.rows,
      exportedAt: new Date().toISOString(),
      source: 'ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech'
    };
    
    fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exported ${users.rows.length} users`);
    console.log(`✅ Exported ${products.rows.length} products`);
    console.log(`✅ Exported ${categories.rows.length} categories`);
    console.log('✅ Data saved to data-export.json');
    
    console.log('\n👥 USER SUMMARY:');
    users.rows.forEach((user: any, i: number) => {
      console.log(`   ${i + 1}. ${user.email} (${user.role}) - ${user.created_at?.slice(0, 10)}`);
    });
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
  
  process.exit(0);
}

exportCurrentData();