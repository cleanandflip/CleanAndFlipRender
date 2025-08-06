import { Router } from 'express';
import { PasswordResetService } from '../services/password-reset.service';
import { z } from 'zod';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();
const passwordResetService = new PasswordResetService();

// SINGLE ENDPOINT FOR PASSWORD RESET REQUEST
router.post('/api/auth/forgot-password', async (req, res) => {
  console.log('='.repeat(60));
  console.log('[API] Password reset request from:', req.ip);
  console.log('[API] Email:', req.body.email);
  
  try {
    const schema = z.object({
      email: z.string().email().toLowerCase().trim()
    });
    
    const { email } = schema.parse(req.body);
    
    const result = await passwordResetService.requestPasswordReset(email);
    
    res.json(result);
    
  } catch (error) {
    console.error('[API] Error:', error);
    res.json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  console.log('='.repeat(60));
});

// TOKEN VALIDATION
router.get('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const valid = await passwordResetService.validateToken(token);
  
  res.json({
    valid: !!valid,
    userId: valid?.user_id
  });
});

// PASSWORD RESET
router.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    const success = await passwordResetService.resetPassword(token, password);
    
    res.json({
      success,
      message: success ? 'Password reset successfully' : 'Failed to reset password'
    });
    
  } catch (error) {
    console.error('[API] Reset error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed'
    });
  }
});

// DIAGNOSTIC ENDPOINT - Only for deployment verification
router.get('/api/debug/database-info', async (req, res) => {
  console.log('[DEBUG] Database info requested from:', req.ip);
  
  try {
    // Check environment variables (REDACTED for security)
    const dbUrl = process.env.DATABASE_URL;
    const hasDbUrl = !!dbUrl;
    const dbHost = dbUrl ? new URL(dbUrl).hostname : 'MISSING';
    
    // Test database connection
    const result = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        current_user as database_user,
        (SELECT COUNT(*) FROM users) as user_count
    `);
    
    // Get sample users (without sensitive data)
    const users = await db.execute(sql`
      SELECT email FROM users LIMIT 3
    `);
    
    res.json({
      timestamp: new Date().toISOString(),
      status: 'operational',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        hasDatabase: hasDbUrl,
        databaseHost: dbHost,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
        appUrl: process.env.APP_URL || 'https://cleanandflip.com'
      },
      database: {
        connected: true,
        name: result.rows[0]?.database_name,
        user: result.rows[0]?.database_user,
        userCount: result.rows[0]?.user_count,
        sampleEmails: users.rows.map(u => u.email)
      }
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        hasDatabase: !!process.env.DATABASE_URL,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
      }
    });
  }
});

export default router;