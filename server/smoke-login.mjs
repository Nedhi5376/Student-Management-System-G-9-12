const base = 'http://localhost:5000/api';
async function login(identifier, password) {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }), credentials: 'include' });
  return { status: r.status, body: await r.json() };
}
const res = await login('nedi jemal', '413892504617');
console.log('LOGIN', res.status, JSON.stringify(res.body, null, 2).slice(0, 500));
process.exit(0);
