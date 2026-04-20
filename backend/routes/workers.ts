import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Get all workers (for admin assignment dropdown)
router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await db.select().from(users).where(eq(users.role, 'worker'));
    const sanitized = workers.map(w => ({ id: w.id, name: w.name, email: w.email, phone: w.phone }));
    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
});

export default router;
