import { Router, Request, Response, NextFunction } from 'express';
import { reviewRepository, ticketRepository } from '../repositories/tickets';
import { insertReviewSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Submit a review for a completed ticket
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const validated = insertReviewSchema.parse(req.body);

    // Check ticket exists and is completed
    const ticket = await ticketRepository.findById(validated.ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (ticket.status !== 'completed') throw new AppError('Can only review completed tickets', 400);

    // Check no duplicate review
    const existing = await reviewRepository.findByTicketId(validated.ticketId);
    if (existing) throw new AppError('Review already submitted for this ticket', 400);

    const review = await reviewRepository.create({
      ...validated,
      studentId: user.id,
      workerId: ticket.workerId || undefined,
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Get all reviews (admin)
router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allReviews = await reviewRepository.findAllWithDetails();
    res.json({ success: true, data: allReviews });
  } catch (error) {
    next(error);
  }
});

// Get reviews for a specific worker
router.get('/worker/:workerId', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req.params.workerId as string;
    const workerReviews = await reviewRepository.findByWorkerId(workerId);
    const stats = await reviewRepository.getWorkerStats(workerId);
    res.json({ success: true, data: { reviews: workerReviews, stats } });
  } catch (error) {
    next(error);
  }
});

// Get review for a specific ticket
router.get('/ticket/:ticketId', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = req.params.ticketId as string;
    const review = await reviewRepository.findByTicketId(ticketId);
    res.json({ success: true, data: review || null });
  } catch (error) {
    next(error);
  }
});

export default router;
