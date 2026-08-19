# Architecture — School Management System (RS)

This document describes the **current** architecture of the system, derived from the actual codebase. It is the authoritative reference; the summary tree in `README.md` is a simplified view.

---

## 1. Overview

The system is a **MERN-stack** (MongoDB, Express, React, Node.js) application split into two deployable units:

- **`server/`** — Node.js + Express REST/SSE API. Owns all business logic, auth, and persistence (Mongoose).
- **`client/`** — React 19 SPA served by Vite. Talks to the API via Axios.

Role-based access is enforced at three levels: client routes (`ProtectedRoute`), API middlewares (`verifyRole`), and Mongoose queries scoped per user.

### High-level diagram

```
┌────────────────────┐         HTTPS          ┌──────────────────────────┐
│    React SPA        │  ───────────────────▶  │   Express API (server)   │
│  (Vite / Tailwind)  │  REST + SSE (events)   │  ┌────────────────────┐  │
│                    │                        │  │ controllers/routes  │  │
│  features/*        │                        │  │        │            │  │
│  lib/axiosInstance │                        │  │ services + models   │  │
└────────────────────┘                        │  └────────┬───────────┘  │
                                              └───────────┼───────────────┘
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  MongoDB (school_db)│
                                                 └──────────────────┘
```

---

## 2. Tech Stack (actual)

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, React Router 7, Tailwind CSS 4 (`@tailwindcss/vite`) |
| **State / Forms** | React Hook Form + Zod v4 resolvers, custom hooks (`useAsync`, `useAuth`, `useMfa`, `useRecordEvents`, `useTheme`) |
| **HTTP** | Axios with interceptors (auto token refresh, auth header injection) |
| **UI** | Lucide icons, `clsx` + `tailwind-merge`, custom components (`Button`, `Field`, `Badge`, `Modal`, `Stat`, `Pagination`, …) |
| **Backend** | Node.js (ESM), Express 4, Mongoose 8, `dotenv` |
| **Auth** | `jsonwebtoken`, `bcrypt`, `otplib` (TOTP), `qrcode` |
| **Security** | `helmet`, `cors`, `express-rate-limit`, `cookie-parser` |
| **Validation** | Zod v3 (server) / Zod v4 (client) — schemas defined per side |
| **Realtime** | Server-Sent Events (SSE) via native `events` controller + in-memory event bus |

> Note: `multer` and `xlsx` are declared in `server/package.json` but are not yet imported anywhere in `src/`.

---

## 3. Project Structure (current)

```
RS/
├── client/                        # React SPA
│   ├── public/
│   ├── index.html
│   ├── vite.config.* / tailwind / postcss
│   └── src/
│       ├── main.jsx               # entry — mounts AuthProvider + ThemeProvider
│       ├── App.jsx                # route table + role guards
│       ├── index.css
│       ├── components/
│       │   ├── ProtectedRoute.jsx # role-aware route guard
│       │   ├── layout/            # AppShell, AuthShell, BrandMark
│       │   └── ui/                # reusable primitives (Button, Field, Modal, …)
│       ├── context/               # AuthContext, ThemeContext (+ hooks)
│       ├── lib/                   # axiosInstance, useAsync, useRecordEvents
│       └── features/
│           ├── auth/              # login, register, MFA, change-password, admin users/overview
│           │   ├── api/  components/  hooks/  pages/  schemas/  utils/
│           ├── admin/             # classes, subjects, assignments, register, academic history
│           │   ├── api/  pages/
│           ├── teacher/           # dashboard, roster, marks & attendance entry
│           │   ├── api/  pages/
│           └── student/           # overview, grades, attendance, transcript
│               ├── api/  pages/
│
└── server/                        # Express API
    └── src/
        ├── app.js                 # app factory (middleware, CORS, route mounting)
        ├── server.js              # bootstrap — connect DB, start listening
        ├── config/
        │   ├── env.js             # env parsing / defaults
        │   └── db.js              # Mongoose connection
        ├── routes/                # per-domain routers
        │   ├── auth.routes.js  user.routes.js  admin.routes.js
        │   ├── teacher.routes.js student.routes.js  events.routes.js
        ├── controllers/           # request handlers per domain
        │   ├── auth.controller.js  mfa.controller.js  user.controller.js
        │   ├── admin.controller.js teacher.controller.js  student.controller.js
        │   ├── class.controller.js subject.controller.js  assignment.controller.js
        │   ├── historicalRecord.controller.js  events.controller.js
        ├── middlewares/           # cross-cutting concerns
        │   ├── verifyJWT.js  verifyJWTQuery.js  verifyRole.js
        │   ├── verifyAdminOrApiKey.js  requirePasswordChange.js
        │   ├── validate.js  asyncHandler.js  rateLimiter.js  errorHandler.js
        ├── services/              # reusable business logic
        │   ├── token.service.js  mfa.service.js  email.service.js  eventBus.js
        ├── models/                # Mongoose schemas
        │   ├── User  Class  Subject  ClassSubject  Assignment
        │   ├── Mark  Attendance  RefreshToken  HistoricalAcademicRecord
        ├── utils/
        │   ├── validators.js  constants.js  httpError.js  logger.js
        └── scripts/
            └── seed-admin.js      # CLI admin seeding utility
```

---

## 4. Server Architecture

### 4.1 Request pipeline (`app.js`)

Order of middleware:

1. `trust proxy` (from env), disable `x-powered-by`
2. `helmet` (security headers, CORP `same-site`)
3. `cors` — allow-list via `CLIENT_ORIGIN` env; credentials enabled
4. `express.json({ limit: '10kb' })`
5. `cookieParser`
6. Global `/api` rate limiter
7. Route mounting:
   - `GET /api/health`
   - `/api/auth` → `authRouter`
   - `/api/users` → `userRouter`
   - `/api/admin` → `adminRouter`
   - `/api/teacher` → `teacherRouter`
   - `/api/student` → `studentRouter`
   - `/api/events` → `eventsRouter` (SSE)
8. `notFoundHandler` → `errorHandler` (uniform error envelope)

### 4.2 Layering

```
routes ──▶ middlewares (auth/role/validation/rate-limit)
             │
             ▼
        controllers      (parse request, orchestrate, send response)
             │
             ▼
          services        (business logic: tokens, MFA, email, event bus)
             │
             ▼
           models         (Mongoose schemas / document access)
             │
             ▼
        MongoDB
```

- Controllers never touch the transport layer directly for cross-cutting concerns — those live in middlewares (`verifyJWT`, `verifyRole`, `validateBody`, rate limiters).
- `asyncHandler` wraps every controller so thrown `HttpError`s propagate to `errorHandler`.
- Validation is centralized in `utils/validators.js` (Zod schemas) and applied via `validateBody`.

### 4.3 Middleware chain per router

| Router | Guard chain |
|--------|-------------|
| `auth` | granular — `loginLimiter`/`mfaLimiter`/`refreshLimiter`; JWT for MFA ops |
| `users` | `verifyJWT` |
| `admin` | global `verifyJWT + verifyRole('admin')`; `verifyAdminOrApiKey` for the external-integrator `POST /historical-records` |
| `teacher` | `verifyJWT + verifyRole('teacher') + requirePasswordChange` |
| `student` | `verifyJWT + verifyRole('student')` |
| `events` | `verifyJWTQuery` (token via query string for SSE) |

### 4.4 Realtime events (SSE)

- `GET /api/events` opens a Server-Sent Events stream authenticated by JWT **in the query string** (`verifyJWTQuery`).
- `services/eventBus.js` keeps an in-memory `Set` of active connections per user, sends 25s heartbeats, and `broadcast(event, data, userId)` pushes per-user events.
- Client consumes this via `lib/useRecordEvents.js` (see §6.4).

---

## 5. Data Models

| Model | Purpose / key fields |
|-------|----------------------|
| **User** | `name, email, passwordHash, role (admin/teacher/student), nationalIdHash, employeeId, qualification, gender, dateOfBirth, phone, address, mfaSecret, mfaEnabled, backupCodes[], refreshTokens[], lockUntil, failedLoginAttempts, emailVerified, emailVerifyTokenHash, mustChangePassword` |
| **Class** | `name, grade, section, capacity, academicYear` |
| **Subject** | `name, code` |
| **ClassSubject** | join of `Class` + `Subject` (unique pair) |
| **Assignment** | `teacher` + `classSubject`, unique per academic year |
| **Mark** | `student` + `assignment` + `term` + `value` + `max` + `recordedBy` + `recordedAt` |
| **Attendance** | `student` + `assignment` + `date` + `status` + `recordedBy` + `recordedAt` |
| **RefreshToken** | `tokenHash, user, userAgent, ip, expiresAt, revoked, replacedBy` (TTL index; rotation + reuse detection) |
| **HistoricalAcademicRecord** | previous academic data imported from an external system: `studentId, academicYear, grade, section, subjects[] (subject/mark/maxMark), average, totalObtained, totalMax, schoolInfo, source (historical/system), notes, createdBy, updatedBy` |

### Relations
- `ClassSubject` many-to-many between Class and Subject.
- `Assignment` binds a teacher to a ClassSubject for an academic year.
- `Mark` / `Attendance` reference student + assignment (each term/date instance).
- `HistoricalAcademicRecord` references `User` (student); unique on `(studentId, academicYear, grade, section)`.

---

## 6. Client Architecture

### 6.1 Routing (`App.jsx`)

Routes are grouped by role using nested `ProtectedRoute` + `AppShell`:

| Path | Role | Purpose |
|------|------|---------|
| `/`, `*` | public | role-aware redirect (`homePathFor(user)`) |
| `/login`, `/register`, `/verify-email` | public | auth flows |
| `/dashboard` | any | role-aware landing |
| `/settings/mfa` | any | MFA setup/enable/disable/backup codes |
| `/settings/password` | any | change password |
| `/student`, `/student/grades`, `/student/attendance`, `/student/transcript` | student | overview, grades, attendance, transcript |
| `/teacher`, `/teacher/assignments/:assignmentId` | teacher | dashboard, roster + marks/attendance |
| `/admin`, `/admin/users`, `/admin/register`, `/admin/register-teacher`, `/admin/classes`, `/admin/subjects`, `/admin/assignments`, `/admin/academic-history` | admin | management pages |

Note: `AdminOverviewPage` and `AdminUsersPage` live under `features/auth/pages/` in the codebase.

### 6.2 Contexts

- **`AuthContext`** — holds user, tokens, session lifecycle (login/logout/MFA), and the `initializing` gate that drives the spinner on reload.
- **`ThemeContext`** — dark/light mode via class toggle + local persistence.

### 6.3 HTTP layer (`lib/axiosInstance.js`)

- Single Axios instance with `baseURL = VITE_API_URL`.
- Request interceptor adds `Authorization: Bearer` access token.
- Response interceptor transparently calls `POST /api/auth/refresh` on `401`, rotates the refresh cookie, and retries the original request once.

### 6.4 Real-time records (`lib/useRecordEvents.js`)

- Opens `EventSource` to `/api/events` with the access token as a query parameter.
- Listens for server-pushed events (e.g. record updates) to refresh cached data without polling.

### 6.5 Feature modules

Each feature folder is self-contained: `api/` (endpoint calls), `pages/` (route components), plus feature-specific `components/`, `hooks/`, `schemas/`, `utils/` where needed (auth).

---

## 7. API Surface (current)

### Auth (`/api/auth`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/verify-email?token=` | none |
| POST | `/login` | none (rate-limited) |
| POST | `/mfa/verify` | MFA token (rate-limited) |
| POST | `/refresh` | refresh cookie (rate-limited) |
| POST | `/logout` | refresh cookie |
| POST | `/logout-all` | access token |
| POST | `/mfa/setup`, `/mfa/enable`, `/mfa/disable`, `/mfa/backup-codes` | access token (rate-limited) |
| POST | `/change-password` | access token |

### Users (`/api/users`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/me` | access token |
| GET | `/search` | access token (user directory search) |

### Admin (`/api/admin`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/stats` | admin |
| GET/POST | `/users` | admin |
| GET/PATCH/DELETE | `/users/:id` | admin |
| GET/POST | `/classes` | admin |
| GET/PATCH/DELETE | `/classes/:id` | admin |
| GET | `/classes/:id/students` | admin |
| GET/POST | `/subjects` | admin |
| PATCH/DELETE | `/subjects/:id` | admin |
| GET/POST | `/assignments` | admin |
| DELETE | `/assignments/:id` | admin |
| POST | `/historical-records` | admin JWT **or** `X-API-Key` (external system) |
| GET | `/historical-records`, `/historical-records/student/:studentId`, `/historical-records/:id` | admin |
| PATCH/DELETE | `/historical-records/:id` | admin |

### Teacher (`/api/teacher`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/assignments`, `/assignments/:id/roster` | teacher |
| GET/POST | `/marks` | teacher |
| GET/POST | `/attendance` | teacher |

### Student (`/api/student`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/overview`, `/grades`, `/attendance`, `/academic-history`, `/transcript` | student |

### Events (`/api/events`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/` (SSE stream) | access token in query string |

### Error envelope
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [...] } }
```

---

## 8. Key Flows

### 8.1 Authentication
1. `POST /api/auth/login` → validates identifier + bcrypt password → issues short-lived access token + rotating refresh token in `httpOnly` cookie.
2. If MFA enabled, a one-time MFA token gates `POST /api/auth/mfa/verify` (TOTP or backup code).
3. Access token expiry → `POST /api/auth/refresh` rotates refresh token (reuse detection revokes the token family on replay).
4. `POST /api/auth/logout(-all)` revokes refresh token(s).

### 8.2 Marks & attendance entry (teacher)
Teacher opens roster → `POST /api/teacher/marks` / `POST /api/teacher/attendance` (Zod-validated) → records stored under the teacher + assignment → SSE broadcast notifies affected clients.

### 8.3 Academic history import (external system)
External system calls `POST /api/admin/historical-records` with `X-API-Key` (or an admin JWT). The `verifyAdminOrApiKey` middleware accepts either; the record is linked to a student by `studentId` (or `nationalId`) and stored as `source: 'historical'`.

---

## 9. Security Considerations

- **Secrets isolation**: separate `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `MFA_SECRET`.
- **Rate limiting**: global `/api` limiter + targeted login/MFA/refresh limiters; brute-force lockout with exponential backoff.
- **Timing-safe login**: dummy bcrypt compare for unknown identifiers.
- **Token hygiene**: refresh tokens stored hashed, rotated, and TTL-indexed; access tokens short-lived (15 min).
- **Password policy**: `requirePasswordChange` middleware forces teacher password change when flagged.
- **Data minimization**: response payloads use `toPublicJSON` projections; passwords/secrets never serialized.
- **Headers/CORS**: helmet defaults, strict origin allow-list, `httpOnly`/`SameSite` cookies, 10kb body cap.

---

## 10. Known Divergences from README

The `README.md` architecture tree is simplified/outdated in these ways:

- Missing server `events` router + SSE event bus, `user.search`, `historicalRecord` controller/model, `multer`/`xlsx` usage, `dotenv`.
- Missing middlewares: `verifyJWTQuery`, `verifyAdminOrApiKey`, `requirePasswordChange`, `asyncHandler`.
- Missing client pieces: `context/`, `components/layout/`, `lib/useRecordEvents`, student transcript route, admin academic-history & register pages, `/settings/*` routes.
- Admin API differs: current admin router is a CRUD router (`/users`, `/classes`, `/subjects`, `/assignments`, `/historical-records`), not the shorthand from the README table.

This file (`Architecture.md`) is the source of truth for the current state.