# School Management System (RS) G-9-12

A production-grade **MERN stack** school management platform with role-based access for administrators, teachers, and students. Built with security-first authentication, comprehensive academic management, and a modern React frontend.

---

## 🏗️ Architecture

```
RS/
├── client/                 # React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── features/
│   │   │   ├── admin/      # Admin dashboard & management pages
│   │   │   ├── teacher/    # Teacher roster, marks & attendance
│   │   │   ├── student/    # Student grades, attendance, overview
│   │   │   └── auth/       # Authentication (login, MFA, registration)
│   │   ├── lib/            # Shared utilities (axios, hooks)
│   │   └── components/ui/  # Reusable UI components
│   └── package.json
│
└── server/                 # Node.js + Express + Mongoose
    ├── src/
    │   ├── controllers/    # Request handlers per domain
    │   ├── models/         # Mongoose schemas (User, Class, Subject, Mark, Attendance)
    │   ├── routes/         # API route definitions
    │   ├── middlewares/    # Auth, validation, rate-limiting, error handling
    │   ├── services/       # Business logic (tokens, MFA, email)
    │   ├── utils/          # Helpers, constants, validators
    │   ├── config/         # DB & environment config
    │   └── scripts/        # Admin seeding utilities
    └── package.json
```

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT access tokens** (15 min) + **rotating refresh tokens** in `httpOnly` cookies
- **bcrypt** password hashing (cost 12) with per-password salts
- **TOTP MFA** (RFC 6238) with QR setup & single-use bcrypt-hashed backup codes
- **Role-based access control**: `admin` | `teacher` | `student`
- **Brute-force protection**: exponential backoff lockout + IP rate limiting
- **Timing-safe login** (dummy bcrypt compare for unknown accounts)
- **Email verification** with bcrypt-hashed tokens
- **Helmet** security headers, strict CORS, body size limits
- **Secret isolation**: three distinct `.env` secrets (access, refresh, MFA)

### 👨‍💼 Admin Portal
- **User management**: paginated directory, role assignment, account status
- **Teacher registration**: full profile (name, National ID, employee ID, qualification, gender, DOB, phone, address)
- **Student registration**: name, National ID, grade, section (National ID doubles as initial password)
- **Class management**: create classes, assign grade/section, capacity
- **Subject management**: create subjects with codes, assign to classes
- **Teacher–Subject–Class assignments**: link teachers to subjects & classes
- **Dashboard statistics**: aggregate counts for users, classes, subjects

### 👨‍🏫 Teacher Portal
- **My Classes dashboard**: view assigned class–subject combinations with student counts
- **Class roster**: paginated student list per assignment
- **Marks entry**: record/edit term marks per student per subject
- **Attendance recording**: mark present/absent/late/excused per session
- **Secure access**: only assigned classes visible

### 👨‍🎓 Student Portal
- **Personal overview**: attendance rate, subjects, class info, grade summary
- **Grades page**: term-wise marks per subject with averages
- **Attendance page**: session history with status breakdown
- **Read-only access** to own academic data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 4 |
| **State/Forms** | React Hook Form + Zod validation, custom `useAsync` hook |
| **HTTP** | Axios with interceptors (auto-refresh, auth headers) |
| **UI** | Lucide icons, custom accessible components (Button, Field, Table, Badge, Stat, Modal) |
| **Backend** | Node.js, Express 4, Mongoose 8 |
| **Auth** | jsonwebtoken, bcrypt, otplib (TOTP), qrcode |
| **Security** | helmet, cors, express-rate-limit, cookie-parser |
| **Validation** | Zod (shared schemas client/server) |
| **Database** | MongoDB 6/7 |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 6/7 (local or Docker)
- npm / pnpm / yarn

### 1. Start MongoDB
```bash
# Using Docker (recommended)
docker run -d --name mongo-rs -p 27017:27017 mongo:7

# Or use a local/remote MongoDB instance
```

### 2. Configure & Start API Server
```bash
cd server
cp .env.example .env
# Edit .env and fill in the three required secrets:
#   ACCESS_TOKEN_SECRET   (openssl rand -base64 48)
#   REFRESH_TOKEN_SECRET  (openssl rand -base64 48)
#   MFA_SECRET            (openssl rand -base64 48)
npm install
npm run dev          # http://localhost:5000
```

### 3. Configure & Start Web Client
```bash
cd ../client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000 (default)
npm install
npm run dev          # http://localhost:5173
```

### 4. Create an Admin Account
Register a normal account via the UI, then promote it:
```bash
docker exec mongo-rs mongosh school_db --quiet --eval \
  'db.users.updateOne({email:"your@email.com"},{$set:{role:"admin"}})'
```
Refresh the browser — `/admin` routes are now accessible.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create account (staff self-register) | No |
| `GET` | `/api/auth/verify-email?token=` | Consume email verification link | No |
| `POST` | `/api/auth/login` | Step 1 — password (identifier = email, name, or National ID) | No |
| `POST` | `/api/auth/mfa/verify` | Step 2 — TOTP or backup code | MFA token |
| `POST` | `/api/auth/refresh` | Rotate refresh token, reissue access token | Refresh cookie |
| `POST` | `/api/auth/logout` | Revoke current refresh token | Refresh cookie |
| `POST` | `/api/auth/logout-all` | Revoke all refresh tokens for user | Access token |
| `POST` | `/api/auth/mfa/setup` | Generate TOTP secret + QR (pending) | Access token |
| `POST` | `/api/auth/mfa/enable` | Confirm code, enable MFA, return backup codes | Access token |
| `POST` | `/api/auth/mfa/disable` | Disable MFA (password + code) | Access token |
| `POST` | `/api/auth/mfa/backup-codes` | Regenerate backup codes | Access token |

### User Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/users/me` | Current user profile | Access token |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/users` | Paginated user list | Access + `admin` |
| `GET` | `/api/admin/stats` | Aggregate counts | Access + `admin` |
| `POST` | `/api/admin/register` | Register teacher/student | Access + `admin` |
| `POST` | `/api/admin/classes` | Create class | Access + `admin` |
| `POST` | `/api/admin/subjects` | Create subject | Access + `admin` |
| `POST` | `/api/admin/assignments` | Assign teacher to subject + class | Access + `admin` |
| `POST` | `/api/admin/historical-records` | Accept previous student data (JSON; `studentId` or `nationalId`) | Admin JWT **or** `X-API-Key` |

### Teacher
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/teacher/assignments` | My class–subject assignments | Access + `teacher` |
| `GET` | `/api/teacher/assignments/:id/roster` | Paginated student roster | Access + `teacher` |
| `POST` | `/api/teacher/assignments/:id/marks` | Record/edit term marks | Access + `teacher` |
| `POST` | `/api/teacher/assignments/:id/attendance` | Record attendance session | Access + `teacher` |

### Student
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/student/overview` | Dashboard summary | Access + `student` |
| `GET` | `/api/student/grades` | Term-wise grades per subject | Access + `student` |
| `GET` | `/api/student/attendance` | Attendance history | Access + `student` |

### Error Format
All errors follow a uniform envelope:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [...] } }
```

---

## 🔧 Development

### Lint & Build
```bash
# Server
cd server && npm run lint

# Client
cd client && npm run lint && npm run build
```

### Environment Variables

**Server (`.env`)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school_db
NODE_ENV=development

# REQUIRED: generate each with: openssl rand -base64 48
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
MFA_SECRET=

# Optional
CLIENT_ORIGIN=http://localhost:5173
TRUST_PROXY=false          # set true only behind reverse proxy (e.g., nginx)
EMAIL_DEV_MODE=true        # returns verification link in response instead of sending

# Optional — external system API key for POST /api/admin/historical-records
# INTEGRATION_API_KEY=<openssl rand -base64 48>
# INTEGRATION_ADMIN_ID=<_id of an admin User>
```

**Client (`.env`)**
```env
VITE_API_URL=http://localhost:5000
```

---

## ✅ Verification Checklist

Run end-to-end via UI or `curl`:

1. **Health check**: `curl localhost:5000/api/health`
2. **Register** → receive dev verification link → verify email
3. **Sign in** → receive access token + `refreshToken` cookie
4. **Enable MFA** from `/settings/mfa` → save backup codes
5. **Sign out → sign in** → complete TOTP challenge
6. **Admin**: access `/admin` (overview, users, classes, subjects, assignments)
7. **Teacher**: access `/teacher` → open roster → record marks & attendance
8. **Student**: access `/student` → view grades & attendance
9. **Idle 15+ min** → confirm silent token refresh works
10. **Reuse detection**: call `/api/auth/refresh` twice with same cookie → 2nd call returns `401` (family revoked)

---

## 📦 Project Structure Details

### Server Models
- **User**: name, email, passwordHash, role, nationalIdHash, employeeId, qualification, gender, dateOfBirth, phone, address, mfaSecret, mfaEnabled, backupCodes[], refreshTokens[], lockUntil, failedLoginAttempts, emailVerified, emailVerifyTokenHash
- **Class**: name, grade, section, capacity, academicYear
- **Subject**: name, code
- **ClassSubject**: class + subject (unique pair)
- **Assignment**: teacher + classSubject (unique per academic year)
- **Mark**: student + assignment + term + value + max + recordedBy + recordedAt
- **Attendance**: student + assignment + date + status + recordedBy + recordedAt
- **RefreshToken**: tokenHash, user, userAgent, ip, expiresAt, revoked, replacedBy (TTL index)

### Client Routes
| Path | Role | Description |
|------|------|-------------|
| `/login`, `/register`, `/verify-email`, `/mfa/*`, `/change-password` | Public | Auth flows |
| `/dashboard` | All | Role-aware redirect |
| `/admin/*` | `admin` | Users, classes, subjects, assignments, stats |
| `/teacher/*` | `teacher` | Assignments, roster, marks, attendance |
| `/student/*` | `student` | Overview, grades, attendance |

---

## 🚧 Roadmap (Not Included)

- Real email transport (SendGrid, Mailgun, etc.)
- Redis-backed rate limiting & refresh-token store for horizontal scaling
- Password reset flow (email → token → new password)
- Automated test suite (unit + integration + e2e)
- Docker Compose for one-command dev/prod deployments
- Audit logging for grade/attendance modifications
- Bulk import (CSV/Excel) for students & teachers
- Parent/guardian portal

---

## 📄 License

MIT — free for personal and commercial use.

---

**School Management System (RS)** — Built with ❤️ for educational institutions.
