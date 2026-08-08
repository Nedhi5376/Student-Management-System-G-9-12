import { connectDb } from './src/config/db.js';
import { User } from './src/models/User.js';
import bcrypt from 'bcrypt';
import { env } from './src/config/env.js';

async function testLogin() {
  await connectDb();
  
  const normalized = 'Administrator';
  const password = 'Nadhii@123456';
  
  // Try email first
  let user = await User.findOne({ email: normalized.toLowerCase() }).select('+passwordHash +failedLoginAttempts +lockedUntil +mfa.secret +mfa.enabled');
  
  // Then nationalId
  if (!user) {
    user = await User.findOne({ nationalId: normalized }).select('+passwordHash +failedLoginAttempts +lockedUntil +mfa.secret +mfa.enabled');
  }
  
  // Then name with case-insensitive exact match using aggregation
  if (!user) {
    const users = await User.aggregate([
      { $match: { $expr: { $eq: [{ $toLower: '$name' }, normalized.toLowerCase()] } } },
      { $limit: 1 }
    ]);
    if (users.length > 0) {
      user = await User.findById(users[0]._id).select('+passwordHash +failedLoginAttempts +lockedUntil +mfa.secret +mfa.enabled');
    }
  }
  
  console.log('User found:', user ? 'YES' : 'NO');
  if (user) {
    console.log('User:', { name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfa?.enabled });
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    console.log('Password matches:', passwordMatches);
  }
  process.exit(0);
}

testLogin().catch(e => { console.error(e); process.exit(1); });