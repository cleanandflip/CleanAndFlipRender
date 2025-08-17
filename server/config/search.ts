import { sql } from 'drizzle-orm';
import { db } from '../db';
import { Logger } from '../utils/logger';

// Initialize full-text search - Neon serverless compatible
export async function initializeSearchIndexes() {
  try {
    Logger.info('Initializing search indexes for Neon serverless...');
    
    // Step 1: Add search vector column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS search_vector tsvector
      `);
      Logger.info('✅ Search vector column ensured');
    } catch (error: any) {
      // Column might already exist, continue
      Logger.debug('Search vector column handling:', error?.message || 'Unknown error');
    }

    // Step 2: Create GIN index for full-text search
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_products_search 
        ON products USING GIN(search_vector)
      `);
      Logger.info('✅ Search index ensured');
    } catch (error: any) {
      // Index might already exist, continue
      Logger.debug('Search index handling:', error?.message || 'Unknown error');
    }

    // Step 3: Update search vectors for existing products (production-safe)
    try {
      const updateResult = await db.execute(sql`
        UPDATE products SET search_vector = 
          setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(brand,'')), 'C')
        WHERE search_vector IS NULL
      `);
      Logger.info('✅ Search vectors updated for existing products');
    } catch (error: any) {
      // Non-critical, search will work without this
      Logger.warn('Search vector update failed (non-critical):', error?.message || 'Unknown error');
    }

    // Step 4: Create trigger function (production-safe)
    try {
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION update_product_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.search_vector := 
            setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
            setweight(to_tsvector('english', coalesce(NEW.brand,'')), 'C');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      Logger.info('✅ Search trigger function created');
    } catch (error: any) {
      Logger.warn('Search trigger function creation failed:', error?.message || 'Unknown error');
    }

    // Step 5: Create trigger (separate call for Neon compatibility)
    try {
      await db.execute(sql`
        DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products
      `);
      
      await db.execute(sql`
        CREATE TRIGGER trigger_update_product_search_vector
          BEFORE INSERT OR UPDATE ON products
          FOR EACH ROW EXECUTE FUNCTION update_product_search_vector()
      `);
      Logger.info('✅ Search trigger created');
    } catch (error: any) {
      Logger.warn('Search trigger creation failed:', error?.message || 'Unknown error');
    }

    Logger.info('✅ Search indexes initialization completed (production-safe)');
  } catch (error: any) {
    Logger.error('Search indexes initialization failed:', error?.message || 'Unknown error');
    Logger.warn('Application will continue without advanced search features');
  }
}

// Advanced product search with ranking
export async function searchProducts(query: string, limit: number = 20, offset: number = 0) {
  const start = Date.now();
  
  try {
    const results = await db.execute(sql`
      SELECT *,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
      FROM products 
      WHERE search_vector @@ plainto_tsquery('english', ${query})
        AND status = 'active'
      ORDER BY rank DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const duration = Date.now() - start;
    Logger.info(`Search query "${query}" completed in ${duration}ms`);

    return results.rows;
  } catch (error) {
    Logger.error('Search query failed:', error);
    return [];
  }
}

// Get search suggestions
export async function getSearchSuggestions(query: string, limit: number = 5) {
  try {
    const results = await db.execute(sql`
      SELECT DISTINCT name
      FROM products 
      WHERE name ILIKE ${`%${query}%`}
        AND status = 'active'
      ORDER BY name
      LIMIT ${limit}
    `);

    return results.rows.map(row => row.name);
  } catch (error) {
    Logger.error('Search suggestions failed:', error);
    return [];
  }
}