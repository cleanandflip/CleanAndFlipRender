import { sql } from 'drizzle-orm';
import { db } from '../db';
import { Logger } from '../utils/logger';

// Initialize full-text search
export async function initializeSearchIndexes() {
  try {
    Logger.info('Initializing search indexes...');
    
    // Test database connection first
    await db.execute(sql`SELECT 1`);
    
    // Add search vector column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);

    // Create GIN index for full-text search
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_products_search 
      ON products USING GIN(search_vector)
    `);

    // Update search vectors for existing products (limit batch size for performance)
    await db.execute(sql`
      UPDATE products SET search_vector = 
        setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
        setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
        setweight(to_tsvector('english', coalesce(brand,'')), 'C')
      WHERE search_vector IS NULL
    `);

    // Create trigger to automatically update search vectors
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

    await db.execute(sql`
      DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products;
      CREATE TRIGGER trigger_update_product_search_vector
        BEFORE INSERT OR UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
    `);

    Logger.info('Full-text search indexes initialized successfully');
  } catch (error: any) {
    Logger.error('Failed to initialize search indexes:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'NO_CODE',
      detail: error?.detail || 'No details available'
    });
    
    // Don't throw the error - let the server continue without search functionality
    Logger.warn('Server will continue without full-text search capabilities');
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