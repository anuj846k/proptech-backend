import 'dotenv/config';
import type { StringValue } from 'ms';
import { AppError } from '#utils/error';

const requiredEnvVars = [
  'ACCESS_SECRET',
  'REFRESH_SECRET',
  'DATABASE_URL',
] as const;

type EnvVar = (typeof requiredEnvVars)[number];

const missingVars: EnvVar[] = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  throw new AppError(
    `Missing required environment variables: ${missingVars.join(', ')}`,
    500,
  );
}

// Cloudinary config - optional, skip validation entirely if not fully configured
const cloudinaryVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const cloudinaryConfigured = cloudinaryVars.every((v) => process.env[v]);

export const config = {
  accessSecret: process.env.ACCESS_SECRET!,
  refreshSecret: process.env.REFRESH_SECRET!,
  accessTokenExpiry: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as StringValue,
  refreshTokenExpiry: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as StringValue,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  cloudinary: cloudinaryConfigured
    ? {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
      }
    : undefined,
};
