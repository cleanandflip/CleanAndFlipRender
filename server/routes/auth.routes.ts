import { Router } from 'express';
import { PasswordResetService } from '../services/password-reset.service';
import { z } from 'zod';

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
      message: error.message
    });
  }
});

export default router;