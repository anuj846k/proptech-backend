# API Documentation

## Base URL

```
http://localhost:8000
```

## Authentication

All protected endpoints require a valid access token sent via:
- Cookie: `access_token` (recommended)
- Header: `Authorization: Bearer <token>`

## Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/users/auth/register` | Register new user | No |
| POST | `/api/v1/users/auth/login` | Login | No |
| POST | `/api/v1/users/auth/refresh` | Refresh tokens | No |
| POST | `/api/v1/users/auth/logout` | Logout | Yes |
| GET | `/api/v1/users/auth/me` | Get current user | Yes |

### Users

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/users/users` | List all users | Yes | ADMIN, MANAGER |
| GET | `/api/v1/users/users/:id` | Get user by ID | Yes | ADMIN |
| PUT | `/api/v1/users/users/:id` | Update user | Yes | ADMIN |

### Properties

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/properties` | List properties | Yes | ADMIN, MANAGER |
| POST | `/api/v1/properties` | Create property | Yes | ADMIN |
| GET | `/api/v1/properties/:id` | Get property | Yes | ADMIN, MANAGER |
| GET | `/api/v1/properties/occupancy` | Get occupancy stats | Yes | ADMIN, MANAGER |
| POST | `/api/v1/properties/:id/assign-manager` | Assign manager | Yes | ADMIN |
| POST | `/api/v1/properties/:id/units` | Create unit | Yes | ADMIN, MANAGER |
| PATCH | `/api/v1/properties/:id/units/:unitId` | Assign tenant | Yes | ADMIN, MANAGER |

### Units

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/units` | List all units | Yes | ADMIN, MANAGER |
| GET | `/api/v1/units/my` | My units | Yes | TENANT |

### Tickets

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/tickets` | List all tickets | Yes | ADMIN, MANAGER |
| POST | `/api/v1/tickets` | Create ticket | Yes | TENANT |
| GET | `/api/v1/tickets/my` | My tickets | Yes | TENANT |
| GET | `/api/v1/tickets/assigned` | Assigned tickets | Yes | TECHNICIAN |
| GET | `/api/v1/tickets/:id` | Get ticket | Yes | All |
| PATCH | `/api/v1/tickets/:id` | Update ticket | Yes | ADMIN, MANAGER |
| PATCH | `/api/v1/tickets/:id/assign` | Assign technician | Yes | ADMIN, MANAGER |
| PATCH | `/api/v1/tickets/:id/progress` | Update progress | Yes | TECHNICIAN |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/notifications` | Get notifications | Yes |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | Yes |

### Activity

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/activity/:ticketId` | Get ticket activity | Yes |

## Response Formats

### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

- 300 requests per 60 seconds per IP
- Returns 429 when exceeded

## Swagger Documentation

Visit `/docs` for interactive API documentation (development only).
