import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, tickets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { userRepository } from '../repositories/users';
import { ticketRepository } from '../repositories/tickets';

const router = Router();

router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await db.select().from(users).where(eq(users.role, 'worker'));
    const sanitized = workers.map(w => ({ id: w.id, name: w.name, email: w.email, phone: w.phone }));
    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/role', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    if (user.role !== 'admin') {
      throw new AppError('Only admin can update user role', 403);
    }
    const { id } = req.params;
    const { role } = req.body;
    if (!['student', 'worker', 'admin'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    const updatedUser = await userRepository.updateRole(id, role);
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.post('/claim/:ticketId', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    if (user.role !== 'worker') {
      throw new AppError('Only workers can claim tickets', 403);
    }
    const { ticketId } = req.params;
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    if (ticket.status !== 'pending') {
      throw new AppError('Ticket is not available for claiming', 400);
    }
    const claimedTicket = await ticketRepository.assignWorker(ticketId, user.id);
    res.json({ success: true, data: claimedTicket });
  } catch (error) {
    next(error);
  }
});

export default router;