import { Router, Request, Response, NextFunction } from 'express';
import { ticketRepository, reviewRepository } from '../repositories/tickets';
import { userRepository } from '../repositories/users';
import { insertTicketSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

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

router.get('/available', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    if (user.role !== 'worker') {
      throw new AppError('Only workers can view available tickets', 403);
    }
    const allTickets = await ticketRepository.findAll();
    const availableTickets = allTickets.filter(t => t.status === 'pending');
    res.json({ success: true, data: availableTickets });
  } catch (error) {
    next(error);
  }
});

router.get('/worker/assigned', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const workerTickets = await ticketRepository.findByWorkerId(user.id);
    res.json({ success: true, data: workerTickets });
  } catch (error) {
    next(error);
  }
});

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

router.get('/stats/summary', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await ticketRepository.getStats();
    const avgRating = await reviewRepository.getAverageRating();
    res.json({ success: true, data: { ...stats, avgRating } });
  } catch (error) {
    next(error);
  }
});

router.get('/my', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    const myTickets = await ticketRepository.findByStudentId(user.id);
    res.json({ success: true, data: myTickets });
  } catch (error) {
    next(error);
  }
});

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

router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user!;
    if (user.role === 'admin') {
      const allTickets = await ticketRepository.findAllWithUsers();
      return res.json({ success: true, data: allTickets });
    }
    const myTickets = await ticketRepository.findByStudentId(user.id);
    res.json({ success: true, data: myTickets });
  } catch (error) {
    next(error);
  }
});

export default router;