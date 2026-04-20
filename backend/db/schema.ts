import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('student'), // student | worker | admin
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'worker', 'admin']).optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = insertUserSchema.partial();

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const signupUserSchema = insertUserSchema
  .extend({
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Tickets Table
// ============================================
export const tickets = pgTable('Tickets', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  ticketNo: text('ticket_no').notNull().unique(),
  studentId: text('student_id').notNull(),
  workerId: text('worker_id'),
  building: text('building').notNull(),
  room: text('room').notNull(),
  faultType: text('fault_type').notNull(), // electric | plumbing | door | other
  description: text('description').notNull(),
  contact: text('contact'),
  imageUrls: text('image_urls'), // JSON array stored as text
  status: text('status').notNull().default('pending'), // pending | assigned | in_progress | completed | cancelled
  workerNote: text('worker_note'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertTicketSchema = createInsertSchema(tickets, {
  building: z.string().min(1, 'Building is required'),
  room: z.string().min(1, 'Room is required'),
  faultType: z.enum(['electric', 'plumbing', 'door', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  contact: z.string().optional(),
  imageUrls: z.string().optional(),
  workerId: z.string().optional(),
  workerNote: z.string().optional(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const updateTicketSchema = insertTicketSchema.partial();

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ============================================
// Reviews Table
// ============================================
export const reviews = pgTable('Reviews', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  ticketId: text('ticket_id').notNull().unique(),
  studentId: text('student_id').notNull(),
  workerId: text('worker_id'),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  tags: text('tags'), // JSON array stored as text
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  ticketId: z.string().min(1, 'Ticket ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  tags: z.string().optional(),
  workerId: z.string().optional(),
});

export const updateReviewSchema = insertReviewSchema.partial();

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ============================================
// Uploads Table
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
