import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '../utils/logger';

const router = Router();

// TEMPORARY ENDPOINT - Only for initial admin setup
// This should be removed after setting up the first admin user
router.post('/api/admin-setup/promote', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId && !email) {
      return res.status(400).json({ error: 'User ID or email required' });
    }
    
    let updateResult;
    if (userId) {
      updateResult = await db
        .update(users)
        .set({ role: 'developer', updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
    } else {
      updateResult = await db
        .update(users)
        .set({ role: 'developer', updatedAt: new Date() })
        .where(eq(users.email, email))
        .returning();
    }
    
    if (updateResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = updateResult[0];
    Logger.info(`User promoted to developer: ${user.email}`);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    Logger.error('Error promoting user to developer:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Get all users (for admin setup purposes)
router.get('/api/admin-setup/users', async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        authProvider: users.authProvider,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.createdAt);
    
    res.json({ users: allUsers });
  } catch (error) {
    Logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;