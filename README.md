# School Management System (RS) G-9-12

A production-grade **MERN stack** school management platform with role-based access for administrators, teachers, and students. Built with security-first authentication, comprehensive academic management, and a modern React frontend.

---

## 🏗️ Architecture

> Full up-to-date details live in [`Architecture.md`](Architecture.md) — this tree is a simplified view.

```
RS/
├── client/                 # React 19 + Vite + Tailwind CSS SPA
│   └── src/
│       ├── App.jsx         # Route table + role-aware guards
│       ├── components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── layout/     # AppShell, AuthShell, BrandMark
│       │   └── ui/         # Reusable UI primitives (Button, Field, Modal, …)
│       ├── context/        # AuthContext, ThemeContext
│       ├── lib/            # axiosInstance, useAsync, useRecordEvents (SSE)
│       └── features/
│           ├── admin/      # Classes, subjects, assignments, registers, academic history
│           ├── teacher/    # Dashboard, roster, marks & attendance
│           ├── student/    # Overview, grades, attendance, transcript
│           └── auth/       # Login, register, MFA, change password, admin users
│
└── server/                 # Node.js + Express + Mongoose API
    └── src/
        ├── app.js          # App factory (middleware, CORS, route mounting)
        ├── server.js       # Bootstrap
        ├── controllers/    # Per-domain request handlers (auth, admin, teacher, student, …)
        ├── models/         # Mongoose schemas (User, Class, Subject, ClassSubject, Assignment,
        │                   #   Mark, Attendance, RefreshToken, HistoricalAcademicRecord)
        ├── routes/         # API route definitions (auth, users, admin, teacher, student, events)
        ├── middlewares/    # verifyJWT(-Query), verifyRole, verifyAdminOrApiKey, validate,
        │                   #   rate limiting, error handling, requirePasswordChange
        ├── services/       # Business logic (tokens, MFA, email, SSE event bus)
        ├── utils/          # Validators (Zod), constants, helpers, logger
        ├── config/         # DB & environment config
        └── scripts/        # Admin seeding utilities
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
- **User management**: paginated directory, search, role assignment, account status
- **Teacher registration**: full profile (name, National ID, employee ID, qualification, gender, DOB, phone, address)
- **Student registration**: name, National ID, grade, section (National ID doubles as initial password)
- **Class management**: create/update classes, assign grade/section, capacity
- **Subject management**: create subjects with codes, assign to classes
- **Teacher–Subject–Class assignments**: link teachers to subjects & classes
- **Dashboard statistics**: aggregate counts for users, classes, subjects
- **Academic history import**: accept previous student records from an external system (`X-API-Key` or admin JWT), full CRUD

### 👨‍🏫 Teacher Portal
- **My Classes dashboard**: view assigned class–subject combinations with student counts
- **Class roster**: paginated student list per assignment
- **Marks entry**: record/edit term marks per student per subject
- **Attendance recording**: mark present/absent/late/excused per session
- **Secure access**: only assigned classes visible; forced password change on first login

### 👨‍🎓 Student Portal
- **Personal overview**: attendance rate, subjects, class info, grade summary
- **Grades page**: term-wise marks per subject with averages
- **Attendance page**: session history with status breakdown
- **Transcript page**: academic transcript incl. imported historical records
- **Read-only access** to own academic data

### 📡 Realtime
- **Server-Sent Events**: per-user push notifications (`/api/events`) so pages refresh when a teacher records marks/attendance

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
| **Validation** | Zod schemas on client (v4) and server (v3) |
| **Realtime** | Server-Sent Events (native, in-memory event bus) |
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
| `GET` | `/api/users/search` | Directory search | Access token |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/stats` | Aggregate counts | Access + `admin` |
| `GET` / `POST` | `/api/admin/users` | List / create users | Access + `admin` |
| `GET` / `PATCH` / `DELETE` | `/api/admin/users/:id` | Read / update / delete user | Access + `admin` |
| `GET` / `POST` | `/api/admin/classes` | List / create classes | Access + `admin` |
| `GET` / `PATCH` / `DELETE` | `/api/admin/classes/:id` | Read / update / delete class | Access + `admin` |
| `GET` | `/api/admin/classes/:id/students` | Class roster | Access + `admin` |
| `GET` / `POST` | `/api/admin/subjects` | List / create subjects | Access + `admin` |
| `PATCH` / `DELETE` | `/api/admin/subjects/:id` | Update / delete subject | Access + `admin` |
| `GET` / `POST` | `/api/admin/assignments` | List / create teacher–subject–class assignments | Access + `admin` |
| `DELETE` | `/api/admin/assignments/:id` | Delete assignment | Access + `admin` |
| `POST` | `/api/admin/historical-records` | Accept previous student data (JSON; `studentId` or `nationalId`) | Admin JWT **or** `X-API-Key` |
| `GET` | `/api/admin/historical-records` | List historical records | Access + `admin` |
| `GET` | `/api/admin/historical-records/student/:studentId` | History for one student | Access + `admin` |
| `GET` / `PATCH` / `DELETE` | `/api/admin/historical-records/:id` | Read / update / delete record | Access + `admin` |

### Teacher
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/teacher/assignments` | My class–subject assignments | Access + `teacher` |
| `GET` | `/api/teacher/assignments/:id/roster` | Paginated student roster | Access + `teacher` |
| `GET` / `POST` | `/api/teacher/marks` | List / record or edit term marks | Access + `teacher` |
| `GET` / `POST` | `/api/teacher/attendance` | List / record attendance sessions | Access + `teacher` |

> Teacher routes also require a non-temporary password (`requirePasswordChange`).

### Student
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/student/overview` | Dashboard summary | Access + `student` |
| `GET` | `/api/student/grades` | Term-wise grades per subject | Access + `student` |
| `GET` | `/api/student/attendance` | Attendance history | Access + `student` |
| `GET` | `/api/student/academic-history` | Imported historical academic records | Access + `student` |
| `GET` | `/api/student/transcript` | Academic transcript | Access + `student` |

### Realtime & Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Service health check | No |
| `GET` | `/api/events` | Server-Sent Events stream (per-user notifications) | Access token (query) |

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
- **HistoricalAcademicRecord**: studentId, academicYear, grade, section, subjects[], average, totalObtained, totalMax, schoolInfo, source (`historical`/`system`), notes, createdBy, updatedBy

### Client Routes
| Path | Role | Description |
|------|------|-------------|
| `/`, `/login`, `/register`, `/verify-email` | Public | Landing redirect & auth flows |
| `/dashboard` | All | Role-aware redirect |
| `/settings/mfa`, `/settings/password` | All | MFA setup & change password |
| `/student`, `/student/grades`, `/student/attendance`, `/student/transcript` | `student` | Overview, grades, attendance, transcript |
| `/teacher`, `/teacher/assignments/:assignmentId` | `teacher` | Dashboard, roster, marks & attendance |
| `/admin`, `/admin/users`, `/admin/register`, `/admin/register-teacher`, `/admin/classes`, `/admin/subjects`, `/admin/assignments`, `/admin/academic-history` | `admin` | Management pages |

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
