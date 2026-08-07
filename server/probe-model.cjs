const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('C:/Users/hp/Desktop/INSA-2018/RS/RS/server/.env', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('MONGO_URI='))
  .split('=')
  .slice(1)
  .join('=');

(async () => {
  await mongoose.connect(env);
  const { User } = await import('file:///C:/Users/hp/Desktop/INSA-2018/RS/RS/server/src/models/User.js');

  // Case A: omit nationalId entirely
  const a = await User.create({ name: '__probe_a__', passwordHash: 'hash', emailVerified: true });
  const aDoc = await mongoose.connection.db.collection('users').findOne({ _id: a._id });
  console.log('omit key -> nationalId in doc:', Object.prototype.hasOwnProperty.call(aDoc, 'nationalId'), aDoc.nationalId);

  // Case B: nationalId: undefined
  const b = await User.create({ name: '__probe_b__', passwordHash: 'hash', emailVerified: true, nationalId: undefined });
  const bDoc = await mongoose.connection.db.collection('users').findOne({ _id: b._id });
  console.log('undefined -> nationalId in doc:', Object.prototype.hasOwnProperty.call(bDoc, 'nationalId'), bDoc.nationalId);

  // Case C: explicit null after missing docs exist
  const c = await User.create({ name: '__probe_c__', passwordHash: 'hash', emailVerified: true, nationalId: null });
  const cDoc = await mongoose.connection.db.collection('users').findOne({ _id: c._id });
  console.log('null -> nationalId in doc:', Object.prototype.hasOwnProperty.call(cDoc, 'nationalId'), cDoc.nationalId);

  // Case D: second explicit null (should fail if unique)
  try {
    await User.create({ name: '__probe_d__', passwordHash: 'hash', emailVerified: true, nationalId: null });
    console.log('second null -> OK (no duplicate conflict)');
  } catch (e) {
    console.log('second null -> FAILED code', e.code);
  }

  await mongoose.connection.db.collection('users').deleteMany({ name: /^__probe_/ });
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
