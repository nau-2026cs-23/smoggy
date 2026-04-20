export type UserRole = 'student' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt?: string;
}

export type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type FaultType = 'electric' | 'plumbing' | 'door' | 'other';

export interface Ticket {
  id: string;
  ticketNo: string;
  studentId: string;
  workerId?: string | null;
  building: string;
  room: string;
  faultType: FaultType;
  description: string;
  contact?: string | null;
  imageUrls?: string | null;
  status: TicketStatus;
  workerNote?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  student?: { id: string; name: string; email: string } | null;
  worker?: { id: string; name: string; email: string } | null;
}

export interface Review {
  id: string;
  ticketId: string;
  studentId: string;
  workerId?: string | null;
  rating: number;
  comment?: string | null;
  tags?: string | null;
  createdAt: string;
  // Joined fields
  student?: { id: string; name: string; email: string } | null;
  worker?: { id: string; name: string; email: string } | null;
  ticket?: Ticket | null;
}

export interface Stats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: number;
  avgRating: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AppView = 'home' | 'submit' | 'my-tickets' | 'ticket-detail' | 'reviews' | 'admin' | 'worker';
