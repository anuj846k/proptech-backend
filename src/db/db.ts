import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '#config/env';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool);
