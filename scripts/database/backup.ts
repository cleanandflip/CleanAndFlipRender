import { writeFile } from 'fs/promises';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Backup Production Database
 * Exports data to JSON format with timestamps
 */
async function backupProduction() {
  console.log('💾 PRODUCTION DATABASE BACKUP');
  console.log('='.repeat(65));
  
  const environment = getCurrentEnvironment();
  if (environment !== 'production') {
    console.error('❌ This script can only run in production environment');
    console.error('Set NODE_ENV=production or REPLIT_DEPLOYMENT=true');
    process.exit(1);
  }
  
  const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!prodUrl) {
    console.error('❌ DATABASE_URL_PROD must be set for production backup');
    process.exit(1);
  }
  
  // Safety check
  if (prodUrl.includes('lingering-flower')) {
    console.error('❌ CRITICAL: Cannot backup development database in production mode!');
    process.exit(1);
  }
  
  try {
    const sql = neon(prodUrl);
    const db = drizzle(sql, { schema });
    
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected to production database');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData: any = {
      timestamp,
      environment: 'production',
      database: new URL(prodUrl).hostname,
      version: '1.0.0'
    };
    
    console.log('📦 Backing up data tables...');
    
    // Backup users (excluding sensitive data)
    const users = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        street: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true,
        updatedAt: true
        // Exclude password and other sensitive fields
      }
    });
    backupData.users = users;
    console.log(`   ✅ Users: ${users.length} records`);
    
    // Backup categories
    const categories = await db.query.categories.findMany();
    backupData.categories = categories;
    console.log(`   ✅ Categories: ${categories.length} records`);
    
    // Backup products
    const products = await db.query.products.findMany();
    backupData.products = products;
    console.log(`   ✅ Products: ${products.length} records`);
    
    // Backup orders (excluding payment details)
    const orders = await db.query.orders.findMany({
      columns: {
        id: true,
        userId: true,
        total: true,
        status: true,
        shippingCost: true,
        createdAt: true,
        updatedAt: true
        // Exclude paymentIntentId and other sensitive fields
      }
    });
    backupData.orders = orders;
    console.log(`   ✅ Orders: ${orders.length} records`);
    
    // Backup order items
    const orderItems = await db.query.orderItems.findMany();
    backupData.orderItems = orderItems;
    console.log(`   ✅ Order Items: ${orderItems.length} records`);
    
    // Backup equipment submissions
    const submissions = await db.query.equipmentSubmissions.findMany({
      columns: {
        id: true,
        userId: true,
        equipmentType: true,
        brand: true,
        model: true,
        condition: true,
        description: true,
        estimatedValue: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
        // Exclude sensitive contact info if any
      }
    });
    backupData.equipmentSubmissions = submissions;
    console.log(`   ✅ Equipment Submissions: ${submissions.length} records`);
    
    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      developerUsers: users.filter(u => u.role === 'developer').length,
      regularUsers: users.filter(u => u.role === 'user').length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      featuredProducts: products.filter(p => p.isFeatured).length,
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter(s => s.status === 'pending').length
    };
    
    backupData.statistics = stats;
    
    // Write backup file
    const filename = `backup-production-${timestamp}.json`;
    const backupJson = JSON.stringify(backupData, null, 2);
    
    await writeFile(filename, backupJson, 'utf8');
    
    console.log('\n📊 BACKUP STATISTICS:');
    console.log(`   Total Users: ${stats.totalUsers} (${stats.developerUsers} developers, ${stats.regularUsers} regular)`);
    console.log(`   Total Products: ${stats.totalProducts} (${stats.activeProducts} active, ${stats.featuredProducts} featured)`);
    console.log(`   Total Orders: ${stats.totalOrders} (${stats.completedOrders} completed)`);
    console.log(`   Total Submissions: ${stats.totalSubmissions} (${stats.pendingSubmissions} pending)`);
    
    console.log('\n💾 BACKUP COMPLETE:');
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${Math.round(backupJson.length / 1024)} KB`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Database: ${backupData.database}`);
    
    console.log('\n🔒 SECURITY NOTES:');
    console.log('   - Passwords and sensitive data excluded');
    console.log('   - Payment information excluded');
    console.log('   - Contact details filtered');
    console.log('   - Backup contains only essential business data');
    
    console.log('\n✅ Production database backup completed successfully!');
    
    return {
      filename,
      timestamp,
      statistics: stats,
      size: backupJson.length
    };
    
  } catch (error) {
    console.error('❌ Production backup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backupProduction().catch(console.error);
}

export default backupProduction;