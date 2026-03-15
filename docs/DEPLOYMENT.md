# Deployment Guide

## Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose v2
- PostgreSQL database

## Environment Variables

Create a `.env` file:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
ACCESS_SECRET=your-access-secret-min-32-chars
REFRESH_SECRET=your-refresh-secret-min-32-chars

# Optional
NODE_ENV=production
PORT=8000
LOG_LEVEL=info

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Token Expiry (optional)
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_POINTS=300
RATE_LIMIT_DURATION=60
```

## Local Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
pnpm start
```

## Docker Deployment

### Development

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Nginx Configuration

The project includes nginx configuration for:

- Reverse proxy to Express backend
- Static file serving (if needed)
- SSL/TLS termination (production)

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T...",
  "uptime": 1234.5,
  "checks": {
    "database": "ok"
  }
}
```

## API Documentation

Swagger UI available at `/docs` (development only).

```bash
# JSON spec
curl http://localhost:8000/docs/openapi.json
```

## Database Migrations

```bash
# Generate migration
pnpm db:generate

# Run migrations
pnpm db:migrate
```

## Logs

Logs are written to:
- `logs/error.log` - Error level only
- `logs/combined.log` - All logs

In production, configure external log aggregation (e.g., Loki, CloudWatch).
