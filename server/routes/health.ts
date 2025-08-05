import { Router } from 'express';
import { getTableColumns } from '../utils/safe-query';

const router = Router();

router.get('/api/health/schema', async (req, res) => {
  try {
    const productColumns = await getTableColumns('products');
    const userColumns = await getTableColumns('users');
    
    const requiredProductColumns = [
      'id', 'name', 'price', 'categoryId', 'condition', 'status',
      'images', 'specifications', 'stockQuantity', 'featured', 'createdAt', 'updatedAt'
    ];
    
    const optionalProductColumns = [
      'subcategory', 'brand', 'weight', 'dimensions', 'views', 'stripeProductId', 'stripePriceId'
    ];
    
    const missingRequired = requiredProductColumns.filter(col => !productColumns.has(col));
    const missingOptional = optionalProductColumns.filter(col => !productColumns.has(col));
    
    const health = {
      status: missingRequired.length === 0 ? 'healthy' : 'needs_migration',
      database: 'connected',
      tables: {
        products: {
          total_columns: productColumns.size,
          columns: Array.from(productColumns).sort(),
          missing_required: missingRequired,
          missing_optional: missingOptional
        },
        users: {
          total_columns: userColumns.size,
          columns: Array.from(userColumns).sort()
        }
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    if (missingRequired.length > 0) {
      res.status(500).json(health);
    } else {
      res.json(health);
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/api/health', async (req, res) => {
  try {
    // Simple health check
    const productColumns = await getTableColumns('products');
    const hasRequiredColumns = ['id', 'name', 'price'].every(col => productColumns.has(col));
    
    res.json({
      status: hasRequiredColumns ? 'ok' : 'degraded',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;