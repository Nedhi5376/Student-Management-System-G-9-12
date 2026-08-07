import { z } from 'zod';

/** Mirrors server/src/utils/validators.js so both sides enforce identical rules. */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

// Validation rules stay in sync with the server so both sides enforce identical requirements.
export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or full name is required'),
  password: z.string().min(1, 'Password is required'),
});

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$|^[A-Za-z0-9-]{8,32}$/, 'Enter a 6-digit code or a backup code'),
});

export const totpOnlySchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit code from your authenticator app'),
});

export const mfaDisableSchema = totpOnlySchema.extend({
  password: z.string().min(1, 'Password is required'),
});
