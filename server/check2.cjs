const { connectDb } = require('./src/config/db.js');
const { User } = require('./src/models/User.js');
(async () => {
  await connectDb();
  const a = await User.findOne({ nationalId: 'ZZTESTTEA001' });
  const b = await User.findOne({ nationalId: 'ZZTESTSTU001' });
  console.log('test teacher:', a ? a._id.toString() + ' ' + a.name : 'NOT FOUND');
  console.log('test student:', b ? b._id.toString() + ' ' + b.name : 'NOT FOUND');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
