import { db } from '../db';
import { tickets, reviews, users, InsertTicket, insertTicketSchema, InsertReview, insertReviewSchema } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateTicketInput = z.infer<typeof insertTicketSchema>;
type UpdateTicketInput = Partial<CreateTicketInput>;
type CreateReviewInput = z.infer<typeof insertReviewSchema>;

// Generate ticket number like WO-2026-XXXX
const generateTicketNo = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WO-${year}-${rand}`;
};

export class TicketRepository {
  async create(data: CreateTicketInput & { studentId: string }) {
    const ticketNo = generateTicketNo();
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...data,
        ticketNo,
        status: 'pending',
      } as InsertTicket)
      .returning();
    return ticket;
  }

  async findById(id: string) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async findByStudentId(studentId: string) {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.studentId, studentId))
      .orderBy(desc(tickets.createdAt));
  }

  async findByWorkerId(workerId: string) {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.workerId, workerId))
      .orderBy(desc(tickets.createdAt));
  }

  async findAll() {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async findAllWithUsers() {
    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    const allUsers = await db.select().from(users);
    return allTickets.map(ticket => ({
      ...ticket,
      student: allUsers.find(u => u.id === ticket.studentId),
      worker: ticket.workerId ? allUsers.find(u => u.id === ticket.workerId) : null,
    }));
  }

  async update(id: string, data: UpdateTicketInput) {
    const updateData: Partial<InsertTicket> = { ...data as Partial<InsertTicket>, updatedAt: new Date() };
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }
    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async assignWorker(ticketId: string, workerId: string) {
    const [ticket] = await db
      .update(tickets)
      .set({ workerId, status: 'assigned', updatedAt: new Date() } as Partial<InsertTicket>)
      .where(eq(tickets.id, ticketId))
      .returning();
    return ticket;
  }

  async getStats() {
    const all = await db.select().from(tickets);
    const total = all.length;
    const completed = all.filter(t => t.status === 'completed').length;
    const pending = all.filter(t => t.status === 'pending').length;
    const inProgress = all.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, completionRate };
  }
}

export class ReviewRepository {
  async create(data: CreateReviewInput & { studentId: string }) {
    const [review] = await db
      .insert(reviews)
      .values(data as InsertReview)
      .returning();
    return review;
  }

  async findByTicketId(ticketId: string) {
    const [review] = await db.select().from(reviews).where(eq(reviews.ticketId, ticketId));
    return review;
  }

  async findByWorkerId(workerId: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.workerId, workerId))
      .orderBy(desc(reviews.createdAt));
  }

  async findAll() {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async findAllWithDetails() {
    const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
    const allUsers = await db.select().from(users);
    const allTickets = await db.select().from(tickets);
    return allReviews.map(review => ({
      ...review,
      student: allUsers.find(u => u.id === review.studentId),
      worker: review.workerId ? allUsers.find(u => u.id === review.workerId) : null,
      ticket: allTickets.find(t => t.id === review.ticketId),
    }));
  }

  async getAverageRating() {
    const all = await db.select().from(reviews);
    if (all.length === 0) return 0;
    const sum = all.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / all.length) * 10) / 10;
  }

  async getWorkerStats(workerId: string) {
    const workerReviews = await db.select().from(reviews).where(eq(reviews.workerId, workerId));
    if (workerReviews.length === 0) return { avgRating: 0, totalReviews: 0 };
    const sum = workerReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avgRating: Math.round((sum / workerReviews.length) * 10) / 10,
      totalReviews: workerReviews.length,
    };
  }
}

export const ticketRepository = new TicketRepository();
export const reviewRepository = new ReviewRepository();
