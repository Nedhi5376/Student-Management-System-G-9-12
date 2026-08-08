const { connectDb } = require('./src/config/db.js');
const { User } = require('./src/models/User.js');
const bcrypt = require('bcrypt');
const { env } = require('./src/config/env.js');

async function testLogin() {
  await connectDb();
  
  const normalized = 'Administrator';
  const password = 'Nadhii@123456';
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const user = await User.findOne({
    $or: [
      { email: normalized.toLowerCase() },
      { name: { $regex: new RegExp(`^${escapeRegExp(normalized)}$`, 'i') } },
      { nationalId: normalized },
    ],
  }).select('+passwordHash +failedLoginAttempts +lockedUntil +mfa.secret +mfa.enabled');
  
  console.log('User found:', user ? 'YES' : 'NO');
  if (user) {
    console.log('User:', { name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfa?.enabled });
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    console.log('Password matches:', passwordMatches);
  }
  process.exit(0);
}

testLogin().catch(e => { console.error(e); process.exit(1); });