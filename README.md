# Secure Registration & Authentication System (MERN)

Production-grade auth: bcrypt password hashing, JWT access tokens + rotating refresh
tokens in httpOnly cookies, TOTP multi-factor authentication with single-use backup
codes, role-based authorization, brute-force lockout, and a hardened Express surface.

- `server/` — Node.js + Express + Mongoose API
- `client/` — React 19 (Vite) + React Hook Form + Zod + Axios

## Quick start

```bash
# MongoDB (any 6/7 instance works)
docker run -d --name mongo-auth -p 27017:27017 mongo:7

# API
cd server
cp .env.example .env          # then fill the three secrets
openssl rand -base64 48       # run 3x, one per secret
npm install && npm run dev    # http://localhost:5000

# Web client
cd ../client
cp .env.example .env
npm install && npm run dev    # http://localhost:5173
```

Promote an account to admin:

```bash
docker exec mongo-auth mongosh secure_auth --quiet --eval \
  'db.users.updateOne({email:"you@example.com"},{$set:{role:"admin"}})'
```

## API

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create account | No |
| GET | `/api/auth/verify-email?token=` | Consume verification link | No |
| POST | `/api/auth/login` | Step 1 — password | No |
| POST | `/api/auth/mfa/verify` | Step 2 — TOTP or backup code | MFA token from step 1 |
| POST | `/api/auth/refresh` | Rotate refresh token, reissue access token | Refresh cookie |
| POST | `/api/auth/logout` | Revoke current refresh token | Refresh cookie |
| POST | `/api/auth/logout-all` | Revoke every refresh token for the user | Access token |
| POST | `/api/auth/mfa/setup` | Generate secret + QR (pending until verified) | Access token |
| POST | `/api/auth/mfa/enable` | Confirm code, enable MFA, return backup codes | Access token |
| POST | `/api/auth/mfa/disable` | Disable MFA (password + code) | Access token |
| POST | `/api/auth/mfa/backup-codes` | Regenerate backup codes | Access token |
| GET | `/api/users/me` | Current profile | Access token |
| GET | `/api/admin/users` | List users (paginated) | Access token + `admin` |
| GET | `/api/admin/stats` | Account aggregate counts | Access token + `admin` |

Errors are uniform: `{ "error": { "code", "message", "details?" } }`.

## Design notes, by module

### Registration
bcrypt (cost 12) with a per-password salt makes offline cracking of a stolen dump
impractical; MD5/SHA1 are fast and therefore unusable for passwords. Registration
always answers `202` with the same message whether or not the email exists, so the
form cannot be used to enumerate accounts. Zod parses and *replaces* the request
body, so unexpected keys and Mongo operator objects (`{"$ne": null}`) never reach the
query layer; `mongoose.set('sanitizeFilter', true)` is a second line of defence.
Email verification tokens are random 256-bit values stored only as bcrypt hashes.

### Login
`bcrypt.compare` runs even for unknown emails (against a dummy hash) so response
time does not reveal whether an account exists — mitigating timing-based
enumeration. Five consecutive failures lock the account, with the lock doubling per
extra failure (30s → 60s → …, capped), which defeats credential stuffing without a
permanent denial of service. `express-rate-limit` caps requests per IP on top of it.

### Tokens
Access tokens are short-lived (15m) and travel in the `Authorization` header, so
they are never persisted anywhere a CSRF or disk-scraping attacker can reach. The
refresh token is `httpOnly`, `secure` (production), `sameSite=strict`, scoped to
`/api/auth`; storing it in `localStorage` would make any XSS a full account
takeover. Each refresh rotates: the old token is marked revoked and linked to its
successor. Presenting an already-rotated token means it leaked, so the whole token
family is revoked — this is what turns replay of a stolen cookie into a dead end.
Only SHA-256 hashes of refresh tokens are stored, and a TTL index expires them.

### Authorization
The role is read from the database record on every request, never from a client
payload or an unverified claim. The frontend `ProtectedRoute` is UX only: bypassing
it just yields a `403` from the API.

### MFA
TOTP (RFC 6238) adds a possession factor, so a leaked password alone is not enough.
The secret is stored as `pendingSecret` until the user proves a working pairing,
which prevents locking the user out of their own account. Step 1 returns only a
short-lived, purpose-scoped MFA token (separate secret, `type: "mfa"`), so a
password alone never yields a session. Verification allows a ±1 step window for
clock drift. Backup codes are bcrypt-hashed and single-use; enabling MFA revokes all
existing refresh tokens so old sessions cannot skip the new factor.

### Hardening
`helmet` sets HSTS/nosniff/frameguard/CSP defaults; CORS lists explicit origins
(never `*`, which is incompatible with credentialed requests anyway); the JSON body
is capped at 10 kB. Secrets live only in `.env` (three distinct secrets — a single
key would let a refresh token be replayed as an access token). The logger redacts
any field whose name looks like a credential and records auth events
(`login.success`, `login.failure`, `mfa.failure`, `refresh.reuse_detected`, …)
without payloads.

## Verifying it works

```bash
curl -s localhost:5000/api/health

# register (dev responses include devVerificationLink)
curl -s -X POST localhost:5000/api/auth/register -H 'content-type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"Str0ng!Passw0rd","confirmPassword":"Str0ng!Passw0rd"}'

# login and keep the refresh cookie
curl -s -c c.txt -X POST localhost:5000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"Str0ng!Passw0rd"}'

curl -s localhost:5000/api/users/me -H "authorization: Bearer <accessToken>"
curl -s localhost:5000/api/admin/users -H "authorization: Bearer <accessToken>"   # 403 for role=user

curl -s -b c.txt -c c2.txt -X POST localhost:5000/api/auth/refresh   # 200, new cookie
curl -s -b c.txt          -X POST localhost:5000/api/auth/refresh    # 401, reuse kills the family
curl -s -b c2.txt         -X POST localhost:5000/api/auth/refresh    # 401, family revoked
```

Checklist, end to end in the UI: register → follow the dev verification link →
sign in → enable MFA from `/settings/mfa` and store the backup codes → “I’ve saved
my codes” returns you to the dashboard, where MFA now reads **Protected** → sign
out → sign in and pass the 6-digit prompt → confirm `/admin` (overview) and
`/admin/users` (directory) load for an `admin` and redirect for a `user` → leave
the tab idle past 15 minutes and confirm requests keep working (silent refresh).

## Lint and build

```bash
cd server && npm run lint
cd client && npm run lint && npm run build
```

## Not included (deliberate next steps)

- Real email transport (`email.service.js` is transport-agnostic; the dev path
  returns the link instead of sending it).
- Redis-backed rate limiting and refresh-token store for multi-instance deploys
  (currently Mongo + in-process counters).
- Password reset flow and automated test suite.
