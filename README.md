# 宿舍保修系统 (Campus Care - Dorm Repair System)

A full-stack dormitory repair management system with student, worker, and admin roles.

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   ├── constants.ts       # JWT, server config
│   │   └── passport.ts        # JWT + local auth strategies
│   ├── db/
│   │   ├── index.ts           # Drizzle DB connection
│   │   ├── schema.ts          # Users, Tickets, Reviews, Uploads tables
│   │   └── migrations/
│   │       ├── 0_init_add_user_model.sql
│   │       └── 1773471824080_add_tickets_reviews.sql
│   ├── middleware/
│   │   ├── auth.ts            # authenticateJWT, authenticateLocal
│   │   └── errorHandler.ts
│   ├── repositories/
│   │   ├── users.ts           # User CRUD
│   │   ├── tickets.ts         # TicketRepository + ReviewRepository
│   │   └── upload.ts
│   ├── routes/
│   │   ├── auth.ts            # /api/auth/signup, login, me
│   │   ├── tickets.ts         # /api/tickets (CRUD, assign, status)
│   │   ├── reviews.ts         # /api/reviews
│   │   ├── workers.ts         # /api/workers (list workers)
│   │   └── upload.ts
│   └── server.ts
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── custom/
│       │   │   ├── Login.tsx       # Login page
│       │   │   ├── Signup.tsx      # Signup page (with role selection)
│       │   │   ├── AdminView.tsx   # Admin dashboard (tickets, reviews, stats)
│       │   │   └── WorkerView.tsx  # Worker dashboard (tasks, reviews)
│       │   └── ui/                 # shadcn/ui components
│       ├── contexts/
│       │   └── AuthContext.tsx     # JWT auth state
│       ├── lib/
│       │   ├── api.ts              # authApi, ticketsApi, reviewsApi, workersApi
│       │   └── utils.ts
│       ├── pages/
│       │   └── Index.tsx           # Main app (student view + routing)
│       ├── types/
│       │   └── index.ts            # Ticket, Review, User, Stats types
│       ├── App.tsx                 # HashRouter + AuthProvider + routes
│       └── index.css               # Campus Care theme (navy + amber)
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, React Router (HashRouter)
- **Backend**: Express.js, TypeScript, Drizzle ORM, Passport.js (JWT + Local)
- **Database**: PostgreSQL
- **Auth**: JWT tokens stored in localStorage

## Features

### Student Role
- Submit repair tickets (building, room, fault type, description, contact)
- View own tickets with real-time status tracking
- Progress tracker with step-by-step timeline
- Rate and review completed repairs (star rating + tags + comment)
- View all community reviews

### Worker Role
- View assigned repair tasks
- Update ticket status (in_progress → completed)
- Add repair notes/remarks
- View personal review history and average rating

### Admin Role
- View all tickets with filtering by status
- Assign workers to pending tickets
- View all reviews and statistics
- Stats dashboard (total, completed, pending, in-progress, completion rate, avg rating)

## Database Schema

- **Users**: id, name, email, password, role (student/worker/admin), phone
- **Tickets**: id, ticketNo, studentId, workerId, building, room, faultType, description, status, workerNote, completedAt
- **Reviews**: id, ticketId, studentId, workerId, rating (1-5), comment, tags

## API Routes

- `POST /api/auth/signup` - Register (role: student/worker/admin)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/tickets` - Submit ticket
- `GET /api/tickets/my` - Student's own tickets
- `GET /api/tickets` - All tickets (admin)
- `GET /api/tickets/worker/assigned` - Worker's tickets
- `PATCH /api/tickets/:id/assign` - Assign worker (admin)
- `PATCH /api/tickets/:id/status` - Update status (worker)
- `GET /api/tickets/stats/summary` - Stats
- `POST /api/reviews` - Submit review
- `GET /api/reviews` - All reviews
- `GET /api/reviews/ticket/:id` - Review for ticket
- `GET /api/reviews/worker/:id` - Worker's reviews
- `GET /api/workers` - List all workers

## Code Generation Guidelines

- All routes require `authenticateJWT` middleware
- Repository methods accept `z.infer<typeof insertXSchema>` types
- Use type assertion `as InsertX` only in `.values()` calls
- Frontend API calls use `getAuthHeaders()` from `lib/api.ts`
- Role-based views: student → Index.tsx, worker → WorkerView.tsx, admin → AdminView.tsx
- JWT payload includes `userId`, `email`, `name`, `role`
