import bcrypt from 'bcrypt';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

async function seedAdmin() {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;

  if (!email || !password?.trim()) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin');
  }

  await connectDb();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      logger.info('admin already exists, skipping');
    } else {
      existing.role = 'admin';
      existing.emailVerified = true;
      await existing.save();
      logger.info('promoted existing user to admin', { email });
    }
    await disconnectDb();
    return;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  await User.create({
    name: env.ADMIN_NAME.trim(),
    email,
    passwordHash,
    role: 'admin',
    emailVerified: true,
  });

  logger.info('admin created', { email });
  await disconnectDb();
}

seedAdmin().catch((error) => {
  logger.error('seed-admin failed', { message: error.message });
  process.exit(1);
});