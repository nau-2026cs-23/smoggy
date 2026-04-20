import { Router, Request, Response, NextFunction } from 'express';
import { ticketRepository, reviewRepository } from '../repositories/tickets';
import { userRepository } from '../repositories/users';
import { insertTicketSchema, insertReviewSchema, updateTicketSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ============================================
// STUDENT ROUTES
// ============================================

// Submit a new repair ticket
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const validated = insertTicketSchema.parse(req.body);
    const ticket = await ticketRepository.create({ ...validated, studentId: user.id });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Get my tickets (student)
router.get('/my', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const myTickets = await ticketRepository.findByStudentId(user.id);
    res.json({ success: true, data: myTickets });
  } catch (error) {
    next(error);
  }
});

// Get single ticket
router.get('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new AppError('Ticket not found', 404);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// ============================================
// WORKER ROUTES
// ============================================

// Get tickets assigned to worker
router.get('/worker/assigned', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const workerTickets = await ticketRepository.findByWorkerId(user.id);
    res.json({ success: true, data: workerTickets });
  } catch (error) {
    next(error);
  }
});

// Worker updates ticket status/note
router.patch('/:id/status', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, workerNote } = req.body as { status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'; workerNote?: string };
    const ticket = await ticketRepository.update(id, { status, workerNote });
    if (!ticket) throw new AppError('Ticket not found', 404);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all tickets (admin)
router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allTickets = await ticketRepository.findAllWithUsers();
    res.json({ success: true, data: allTickets });
  } catch (error) {
    next(error);
  }
});

// Assign worker to ticket (admin)
router.patch('/:id/assign', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { workerId } = req.body as { workerId: string };
    if (!workerId) throw new AppError('Worker ID is required', 400);
    const ticket = await ticketRepository.assignWorker(id, workerId);
    if (!ticket) throw new AppError('Ticket not found', 404);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Get stats
router.get('/stats/summary', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await ticketRepository.getStats();
    const avgRating = await reviewRepository.getAverageRating();
    res.json({ success: true, data: { ...stats, avgRating } });
  } catch (error) {
    next(error);
  }
});

export default router;
