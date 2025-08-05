import { Request, Response } from 'express';
import { storage } from '../storage';
import { logger } from './logger';
import { redis } from './cache';
import { db } from './database';
import { sql } from 'drizzle-orm';

// Development-only performance testing endpoint
export async function performanceTest(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const tests: any[] = [];
  const startTime = Date.now();
  
  try {
    // Test 1: Database Connection Pool
    logger.info('Testing database connection pool...');
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1 as test`);
    const dbDuration = Date.now() - dbStart;
    tests.push({
      name: 'Database Connection Pool',
      duration: dbDuration,
      status: dbDuration < 100 ? 'EXCELLENT' : dbDuration < 500 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      details: `Query executed in ${dbDuration}ms`
    });
    
    // Test 2: Redis Cache
    if (redis) {
      logger.info('Testing Redis cache...');
      const cacheStart = Date.now();
      await (redis as any).set('test_key', 'test_value', 'EX', 60);
      const cached = await (redis as any).get('test_key');
      await (redis as any).del('test_key');
      const cacheDuration = Date.now() - cacheStart;
      tests.push({
        name: 'Redis Cache',
        duration: cacheDuration,
        status: cacheDuration < 50 ? 'EXCELLENT' : cacheDuration < 200 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        details: `Cache operations completed in ${cacheDuration}ms`
      });
    } else {
      tests.push({
        name: 'Redis Cache',
        duration: 0,
        status: 'DISABLED',
        details: 'Redis not configured - running without cache'
      });
    }
    
    // Test 3: Full-text Search Index
    logger.info('Testing search indexes...');
    const searchStart = Date.now();
    const searchResults = await db.execute(sql`
      SELECT COUNT(*) as indexed_products 
      FROM products 
      WHERE search_vector IS NOT NULL
    `);
    const searchDuration = Date.now() - searchStart;
    tests.push({
      name: 'Full-text Search',
      duration: searchDuration,
      status: searchDuration < 100 ? 'EXCELLENT' : searchDuration < 300 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      details: `${searchResults.rows[0]?.indexed_products || 0} products indexed for search`
    });
    
    // Test 4: Featured Products Cache
    logger.info('Testing featured products performance...');
    const featuredStart = Date.now();
    const featured = await storage.getFeaturedProducts(6);
    const featuredDuration = Date.now() - featuredStart;
    tests.push({
      name: 'Featured Products Query',
      duration: featuredDuration,
      status: featuredDuration < 200 ? 'EXCELLENT' : featuredDuration < 500 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      details: `${featured?.length || 0} featured products loaded in ${featuredDuration}ms`
    });
    
    // Test 5: Category Loading
    logger.info('Testing category performance...');
    const categoryStart = Date.now();
    const categories = await storage.getCategories();
    const categoryDuration = Date.now() - categoryStart;
    tests.push({
      name: 'Categories Query',
      duration: categoryDuration,
      status: categoryDuration < 150 ? 'EXCELLENT' : categoryDuration < 400 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      details: `${categories?.length || 0} categories loaded in ${categoryDuration}ms`
    });
    
    const totalDuration = Date.now() - startTime;
    const overallStatus = tests.every(t => t.status === 'EXCELLENT') ? 'EXCELLENT' : 
                         tests.some(t => t.status === 'NEEDS_IMPROVEMENT') ? 'NEEDS_IMPROVEMENT' : 'GOOD';
    
    res.json({
      summary: {
        totalDuration,
        overallStatus,
        testsRun: tests.length,
        timestamp: new Date().toISOString()
      },
      tests,
      recommendations: generatePerformanceRecommendations(tests)
    });
    
  } catch (error) {
    logger.error('Performance test failed:', error);
    res.status(500).json({
      error: 'Performance test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generatePerformanceRecommendations(tests: any[]) {
  const recommendations = [];
  
  const dbTest = tests.find(t => t.name === 'Database Connection Pool');
  if (dbTest && dbTest.duration > 200) {
    recommendations.push('Consider increasing database connection pool size or check network latency');
  }
  
  const cacheTest = tests.find(t => t.name === 'Redis Cache');
  if (cacheTest && cacheTest.status === 'DISABLED') {
    recommendations.push('Enable Redis caching for improved performance');
  }
  
  const searchTest = tests.find(t => t.name === 'Full-text Search');
  if (searchTest && searchTest.duration > 150) {
    recommendations.push('Consider reindexing search vectors or checking database load');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All systems performing optimally! 🎯');
  }
  
  return recommendations;
}