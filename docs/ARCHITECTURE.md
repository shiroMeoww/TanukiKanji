# Architecture Documentation

## Overview

Tanuki Kanji is a full-stack web application for learning Japanese using spaced repetition. It follows a monolithic architecture with Next.js handling both frontend and backend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Login    │  │ Dashboard  │  │  Reviews   │            │
│  │   Page     │  │    Page    │  │    Page    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  └──────────────── React Components ────────────────┘       │
└──────────────────────────│──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (REST)                        │  │
│  │                                                        │  │
│  │  /api/auth/*      Authentication endpoints            │  │
│  │  /api/user/*      User profile & stats                │  │
│  │  /api/lessons/*   Lessons management                  │  │
│  │  /api/reviews/*   Reviews & quiz                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Logic                           │  │
│  │                                                        │  │
│  │  auth.ts          JWT & session management            │  │
│  │  srs.ts           Spaced repetition logic             │  │
│  │  middleware.ts    Auth verification                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────│──────────────────────────────────┘
                           │ PostgreSQL Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                                                              │
│  users, sessions, kanji, vocabulary,                         │
│  user_progress, review_history                               │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript

### Backend
- **Next.js API Routes**: REST API endpoints
- **pg**: PostgreSQL client for Node.js
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **zod**: Schema validation

### Database
- **PostgreSQL 15**: Relational database
- **pg_trgm**: Full-text search (future)

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Component Structure

### Frontend Components

```
src/components/
├── AuthContext.tsx        # Global auth state management
└── Navbar.tsx            # Navigation bar

src/app/
├── page.tsx              # Landing page (redirects)
├── login/page.tsx        # Login form
├── register/page.tsx     # Registration form
├── dashboard/page.tsx    # Main dashboard
├── lessons/page.tsx      # Lessons interface
└── reviews/page.tsx      # Review quiz interface
```

### API Structure

```
src/app/api/
├── auth/
│   ├── login/route.ts           # POST /api/auth/login
│   ├── register/route.ts        # POST /api/auth/register
│   └── logout/route.ts          # POST /api/auth/logout
├── user/
│   ├── profile/route.ts         # GET /api/user/profile
│   └── stats/route.ts           # GET /api/user/stats
├── lessons/
│   ├── route.ts                 # GET /api/lessons
│   ├── complete/route.ts        # POST /api/lessons/complete
│   └── unlock/route.ts          # POST /api/lessons/unlock
└── reviews/
    ├── route.ts                 # GET /api/reviews
    └── submit/route.ts          # POST /api/reviews/submit
```

### Library Structure

```
src/lib/
├── db.ts              # PostgreSQL connection pool
├── auth.ts            # Authentication utilities
├── srs.ts             # SRS algorithm implementation
└── middleware.ts      # Request middleware
```

## Data Flow

### Authentication Flow

```
1. User submits credentials
   └─> POST /api/auth/login

2. Server verifies password
   └─> bcrypt.compare(password, hash)

3. Generate JWT token
   └─> jwt.sign({ userId }, secret)

4. Create session in database
   └─> INSERT INTO sessions

5. Return token to client
   └─> Store in localStorage

6. Client includes token in requests
   └─> Authorization: Bearer <token>

7. Server validates token
   └─> middleware.authenticate()
```

### Review Flow

```
1. User requests reviews
   └─> GET /api/reviews
   └─> Fetch items where available_at <= NOW()
   └─> Create question pairs (meaning + reading)
   └─> Shuffle and return

2. User submits answer
   └─> POST /api/reviews/submit
   └─> Check if answer is correct
   └─> Update SRS stage (+1 if correct, -1 if wrong)
   └─> Calculate next review time
   └─> Record in review_history
   └─> Check if user can level up
```

### SRS Algorithm

```typescript
// SRS Stage Intervals
const STAGES = {
  0: 0,           // Lesson (immediate)
  1: 4h,          // Apprentice 1
  2: 8h,          // Apprentice 2
  3: 2d,          // Apprentice 3
  4: 6d,          // Guru 1
  5: 10d,         // Guru 2
  6: 30d,         // Master
};

// On correct answer
newStage = min(currentStage + 1, 6)

// On incorrect answer
newStage = max(currentStage - 1, 0)

// Next review time
nextReview = now + STAGES[newStage]
```

### Level Progression

```
Requirements to level up:
1. 90% of items at stage 4+ (Guru or higher)
2. Remaining 10% at stage 3+ (Apprentice 3+)

When user levels up:
- current_level incremented
- New items become available for unlock
```

## Database Schema

### Core Tables

**users**
- Primary user account data
- Stores hashed passwords
- Tracks current level

**sessions**
- Active JWT sessions
- Automatic expiry after 7 days

**kanji**
- Kanji characters with readings
- Levels 1-60 (currently using 1-3)

**vocabulary**
- Vocabulary words with readings
- Linked to kanji via junction table

**user_progress**
- User's SRS progress for each item
- Tracks stage, next review time, streaks

**review_history**
- Complete audit log of all reviews
- Used for analytics and debugging

### Relationships

```
users (1) ──── (N) sessions
users (1) ──── (N) user_progress
kanji (N) ──── (N) vocabulary
user_progress (N) ──── (1) kanji/vocabulary
```

## Security

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- Secure session storage in database

### Authorization
- Middleware checks on all protected routes
- Role-based access control (user/admin)
- Token validation on every request

### Input Validation
- Zod schema validation on all inputs
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

## Performance Considerations

### Database
- Indexes on frequently queried columns
- Connection pooling (max 20 connections)
- Prepared statements for common queries

### Frontend
- Client-side state caching (React state)
- Minimal re-renders with React hooks
- Lazy loading of routes

### Caching Strategy
- JWT tokens cached in localStorage
- User data cached in React context
- No server-side caching currently implemented

## Scalability

### Current Limitations
- Single database instance
- No horizontal scaling
- No CDN for static assets

### Future Improvements
- Read replicas for database
- Redis for session storage
- Load balancer for API
- CDN for frontend assets
- Separate services for auth, lessons, reviews

## Deployment

### Docker Compose
```yaml
services:
  postgres:      # Database
  backend:       # Next.js app (frontend + API)
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `NODE_ENV`: Environment (development/production)

## Monitoring & Logging

### Current Implementation
- Console logging in development
- Query execution time logging
- Error logging to console

### Recommended Additions
- Application Performance Monitoring (APM)
- Structured logging (Winston/Pino)
- Error tracking (Sentry)
- Database query monitoring
- User analytics

## Testing Strategy

### Recommended Tests
- **Unit Tests**: Business logic (SRS algorithm)
- **Integration Tests**: API endpoints
- **E2E Tests**: User flows (Cypress/Playwright)
- **Database Tests**: SQL queries and migrations

## Future Architecture Considerations

### Microservices
Split into separate services:
- Auth Service
- Lesson Service
- Review Service
- User Service
- Analytics Service

### Event-Driven Architecture
- Use message queue (RabbitMQ/Kafka)
- Async processing of reviews
- Real-time progress updates

### Mobile Apps
- Expose GraphQL API
- React Native apps
- Shared authentication
