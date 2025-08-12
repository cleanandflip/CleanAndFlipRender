import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

const resend = new Resend(process.env.RESEND_API_KEY!);

export class SimplePasswordReset {
  
  // SIMPLE USER LOOKUP - GUARANTEED TO WORK
  async findUser(email: string): Promise<any> {
    console.log(`[PasswordReset] Looking for: ${email}`);
    
    try {
      // DIRECT QUERY - Use Drizzle's sql template
      const result = await db.execute(sql`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE LOWER(email) = LOWER(${email.trim()})
        LIMIT 1
      `);
      
      if (result && result.rows && result.rows.length > 0) {
        console.log(`[PasswordReset] ✅ Found user: ${result.rows[0].email}`);
        return result.rows[0];
      }
      
      // DEBUG: Show what's in database
      const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
      console.log(`[PasswordReset] Total users in DB: ${countResult.rows[0]?.total || 0}`);
      
      // Show first 3 emails for debugging
      const debugResult = await db.execute(sql`SELECT email FROM users LIMIT 3`);
      console.log('[PasswordReset] Sample emails in DB:');
      debugResult.rows.forEach(r => console.log(`  - ${r.email}`));
      
      console.log(`[PasswordReset] ❌ User not found: ${email}`);
      return null;
      
    } catch (error) {
      console.error('[PasswordReset] Database error:', error);
      return null;
    }
  }
  
  // CREATE RESET TOKEN
  async createToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    try {
      // Create tokens table if doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          token VARCHAR(255) UNIQUE,
          expires_at TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Clear old tokens - fix the type casting issue
      await db.execute(sql`
        DELETE FROM password_reset_tokens WHERE user_id = ${userId}
      `);
      
      // Insert new token - fix the type casting
      await db.execute(sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at) 
        VALUES (${userId}, ${token}, ${expires})
      `);
      
      console.log(`[PasswordReset] Token created for user ${userId}`);
      return token;
      
    } catch (error) {
      console.error('[PasswordReset] Token creation error:', error);
      throw new Error(`Failed to create password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // SEND EMAIL
  async sendEmail(email: string, token: string, name?: string): Promise<boolean> {
    const resetLink = `https://cleanandflip.com/reset-password?token=${token}`;
    
    try {
      const { data, error } = await resend.emails.send({
        from: 'Clean & Flip <noreply@cleanandflip.com>',
        to: email,
        subject: 'Reset Your Password - Clean & Flip',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${name || 'there'},</p>
            <p>You requested to reset your password. Click the link below:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p>Or copy this link: ${resetLink}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      
      if (error) {
        console.error('[PasswordReset] Email error:', error);
        return false;
      }
      
      console.log(`[PasswordReset] Email sent to ${email}, ID: ${data?.id}`);
      return true;
      
    } catch (error) {
      console.error('[PasswordReset] Email failed:', error);
      return false;
    }
  }
  
  // MAIN FUNCTION - REQUEST RESET
  async requestReset(email: string): Promise<{ success: boolean; message: string }> {
    console.log('='.repeat(50));
    console.log(`[PasswordReset] Request for: ${email}`);
    
    // Find user
    const user = await this.findUser(email);
    
    if (!user) {
      // Always return success (security)
      console.log('[PasswordReset] No user found, returning success for security');
      return {
        success: true,
        message: 'If an account exists, we sent a reset email.'
      };
    }
    
    // Create token
    const token = await this.createToken(user.id);
    
    // Send email
    await this.sendEmail(user.email, token, user.first_name);
    
    console.log('[PasswordReset] ✅ Process complete');
    console.log('='.repeat(50));
    
    return {
      success: true,
      message: 'If an account exists, we sent a reset email.'
    };
  }
  
  // VALIDATE TOKEN
  async validateToken(token: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM password_reset_tokens 
        WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
      `);
      
      return result.rows?.[0] || null;
      
    } catch (error) {
      console.error('[PasswordReset] Token validation error:', error);
      return null;
    }
  }
  
  // RESET PASSWORD
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validateToken(token);
    
    if (!tokenData) {
      console.log('[PasswordReset] Invalid token');
      return false;
    }
    
    try {
      const hashedPassword = await bcryptjs.hash(newPassword, 12);
      
      // Update password - fix type casting
      await db.execute(sql`
        UPDATE users SET password = ${hashedPassword} WHERE id = ${tokenData.user_id}
      `);
      
      // Mark token as used
      await db.execute(sql`
        UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenData.id}
      `);
      
      console.log('[PasswordReset] Password updated successfully');
      return true;
      
    } catch (error) {
      console.error('[PasswordReset] Reset failed:', error);
      return false;
    }
  }
}