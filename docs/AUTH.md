# Authentication

## Overview

The API uses JWT-based authentication with access and refresh tokens.

## Token Strategy

### Access Token

| Property | Value |
|----------|-------|
| Type | JWT |
| Lifetime | 15 minutes (configurable) |
| Storage | HTTP-only cookie |
| Purpose | API authorization |

**Payload:**
```json
{
  "userId": "uuid",
  "role": "ADMIN|MANAGER|TECHNICIAN|TENANT",
  "iat": 1705312800,
  "exp": 1705313700
}
```

### Refresh Token

| Property | Value |
|----------|-------|
| Type | JWT |
| Lifetime | 7 days (configurable) |
| Storage | HTTP-only cookie |
| Purpose | Obtain new access token |

## Authentication Flow

```
┌────────┐                ┌─────────┐
│ Client │                │   API   │
└────────┘                └─────────┘
    │                          │
    │  1. POST /auth/login     │
    │─────────────────────────▶│
    │                          │
    │  2. Set cookies:        │
    │    - access_token        │
    │    - refresh_token       │
    │◀─────────────────────────│
    │                          │
    │  3. Requests with        │
    │     cookies (auto)       │
    │─────────────────────────▶│
    │                          │
    │  4. Token expired?      │
    │     POST /auth/refresh   │
    │─────────────────────────▶│
    │                          │
    │  5. New tokens           │
    │◀─────────────────────────│
```

## Endpoints

### Register

```
POST /api/v1/users/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "ADMIN|MANAGER|TECHNICIAN|TENANT",
  "phone": "1234567890"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Login

```
POST /api/v1/users/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Refresh Token

```
POST /api/v1/users/auth/refresh
```

Automatically uses the refresh_token cookie. No body required.

### Logout

```
POST /api/v1/users/auth/logout
```

Clears authentication cookies.

### Get Current User

```
GET /api/v1/users/auth/me
```

Returns the currently authenticated user.

## Roles

| Role | Description |
|------|-------------|
| ADMIN | Full access, can manage users |
| MANAGER | Manage properties, units, assign tenants |
| TECHNICIAN | View and update assigned tickets |
| TENANT | Create tickets, view own units |

## Security Features

- **Password Hashing**: Argon2
- **HTTP-only Cookies**: Tokens not accessible via JavaScript
- **Secure Cookies**: Only sent over HTTPS in production
- **SameSite**: CSRF protection
- **Rate Limiting**: 300 requests per 60 seconds
