const base = 'http://localhost:5000/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTc2MzA3M2ZhN2ZiMjNhYzdiYTUxOGYiLCJyb2xlIjoidGVhY2hlciIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3ODYxNjg2MzQsImV4cCI6MTc4NjE2OTUzNH0.u8VFYCfs4PhJl_0MFcrHGysTYbT3T62GSADKZ8GKVc';
const r = await fetch(`${base}/teacher/assignments`, { headers: { Authorization: `Bearer ${token}` } });
console.log('GET /teacher/assignments ->', r.status, JSON.stringify(await r.json()));
process.exit(0);
