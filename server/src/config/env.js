import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1),
  // Set to true only when the app sits behind a reverse proxy that overwrites
  // X-Forwarded-For; otherwise anyone can spoof it to bypass IP rate limits.
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  MFA_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  MFA_TOKEN_TTL: z.string().default('5m'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).default(12),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  MFA_ISSUER: z.string().default('SecureAuth'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default('Administrator'),
  STUDENT_COMMON_PASSWORD: z.string().default('student123'),
  TEACHER_COMMON_PASSWORD: z.string().default('teacher123'),
  // Optional: enables the external-system API key on the historical-record
  // accept endpoint. INTEGRATION_ADMIN_ID is the _id of an admin User that will
  // be recorded as the creator of accepted records.

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Invalid or missing environment variables: ${missing}`);
}

export const env = {
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  isProduction: parsed.data.NODE_ENV === 'production',
  studentCommonPassword: parsed.data.STUDENT_COMMON_PASSWORD,
  teacherCommonPassword: parsed.data.TEACHER_COMMON_PASSWORD,
};
