# Architecture

## System Overview

The Property Maintenance API is a monolithic Express.js backend that handles authentication, property management, unit management, maintenance tickets, and notifications.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Nginx     │────▶│   Express   │
│  (Next.js)  │     │  (Reverse   │     │   Backend   │
└─────────────┘     │   Proxy)    │     └──────┬──────┘
                    └─────────────┘            │
                                               │
                    ┌─────────────┐            │
                    │ PostgreSQL  │◀───────────┘
                    │  (Drizzle)  │
                    └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Cloudinary │
                    │  (Images)   │
                    └─────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL with Drizzle ORM |
| Authentication | JWT (Access + Refresh tokens) |
| Validation | Zod |
| Logging | Winston |
| File Storage | Cloudinary |
| Load Balancer | Nginx |

## Project Structure

```
src/
├── config/          # Environment configuration
├── db/              # Database connection & migrations
├── modules/         # Feature modules
│   ├── user/        # Auth, user management
│   ├── property/    # Property CRUD
│   ├── unit/       # Unit management
│   ├── ticket/     # Maintenance tickets
│   ├── notification/
│   └── activity/   # Ticket activity log
├── openapi/        # OpenAPI spec
└── utils/          # Helpers, middleware, logger
```

## Authentication Flow

1. **Register/Login** → Returns `access_token` (15min) + `refresh_token` (7d) as HTTP-only cookies
2. **API Requests** → Token validated via middleware
3. **Token Expired** → Frontend auto-refreshes using refresh token cookie
4. **Logout** → Clears cookies

## Security

- JWT access/refresh tokens
- Password hashing with Argon2
- Role-based access control (ADMIN, MANAGER, TECHNICIAN, TENANT)
- Rate limiting (300 req/60s)
- CORS configuration
- Input validation with Zod
