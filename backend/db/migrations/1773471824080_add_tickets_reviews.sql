-- Migration: Add role/phone to Users, create Tickets and Reviews tables

-- Add role and phone columns to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'student';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Create Tickets table
CREATE TABLE IF NOT EXISTS "Tickets" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "ticket_no" TEXT NOT NULL UNIQUE,
    "student_id" TEXT NOT NULL,
    "worker_id" TEXT,
    "building" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "fault_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT,
    "image_urls" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "worker_note" TEXT,
    "completed_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "tickets_student_id_idx" ON "Tickets"("student_id");
CREATE INDEX IF NOT EXISTS "tickets_worker_id_idx" ON "Tickets"("worker_id");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "Tickets"("status");

-- Create Reviews table
CREATE TABLE IF NOT EXISTS "Reviews" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" TEXT NOT NULL UNIQUE,
    "student_id" TEXT NOT NULL,
    "worker_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reviews_ticket_id_idx" ON "Reviews"("ticket_id");
CREATE INDEX IF NOT EXISTS "reviews_worker_id_idx" ON "Reviews"("worker_id");
