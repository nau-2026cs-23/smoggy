import { API_BASE_URL } from '../config/constants';
import type { ApiResponse, Ticket, Review, User, Stats } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json() as Promise<ApiResponse<{ token: string; user: User }>>;
  },

  async signup(name: string, email: string, password: string, confirmPassword: string, role: string = 'student'): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword, role }),
    });
    return res.json() as Promise<ApiResponse<{ token: string; user: User }>>;
  },

  async me(): Promise<ApiResponse<{ user: User }>> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<{ user: User }>>;
  },
};

export const ticketsApi = {
  async create(data: {
    building: string;
    room: string;
    faultType: string;
    description: string;
    contact?: string;
    imageUrls?: string;
  }): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<Ticket>>;
  },

  async getMyTickets(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/my`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket[]>>;
  },

  async getById(id: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket>>;
  },

  async getAll(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket[]>>;
  },

  async getAvailable(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/available`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket[]>>;
  },

  async getWorkerTickets(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/worker/assigned`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket[]>>;
  },

  async updateStatus(id: string, status: string, workerNote?: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, workerNote }),
    });
    return res.json() as Promise<ApiResponse<Ticket>>;
  },

  async assignWorker(ticketId: string, workerId: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workerId }),
    });
    return res.json() as Promise<ApiResponse<Ticket>>;
  },

  async getStats(): Promise<ApiResponse<Stats>> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/stats/summary`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Stats>>;
  },
};

export const reviewsApi = {
  async create(data: {
    ticketId: string;
    rating: number;
    comment?: string;
    tags?: string;
  }): Promise<ApiResponse<Review>> {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<Review>>;
  },

  async getAll(): Promise<ApiResponse<Review[]>> {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Review[]>>;
  },

  async getByTicket(ticketId: string): Promise<ApiResponse<Review | null>> {
    const res = await fetch(`${API_BASE_URL}/api/reviews/ticket/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Review | null>>;
  },

  async getByWorker(workerId: string): Promise<ApiResponse<{ reviews: Review[]; stats: { avgRating: number; totalReviews: number } }>> {
    const res = await fetch(`${API_BASE_URL}/api/reviews/worker/${workerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<{ reviews: Review[]; stats: { avgRating: number; totalReviews: number } }>>;
  },
};

export const workersApi = {
  async getAll(): Promise<ApiResponse<User[]>> {
    const res = await fetch(`${API_BASE_URL}/api/workers`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<User[]>>;
  },

  async claimTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${API_BASE_URL}/api/workers/claim/${ticketId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<ApiResponse<Ticket>>;
  },

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<User>> {
    const res = await fetch(`${API_BASE_URL}/api/workers/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    return res.json() as Promise<ApiResponse<User>>;
  },
};