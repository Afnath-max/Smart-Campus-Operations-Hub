# Smart Campus Operations Hub

Smart Campus Operations Hub is a production-inspired university operations platform built with Spring Boot, PostgreSQL, React, and Vite. It covers secure role-based access, Google OAuth and local campus login, resource management, conflict-aware bookings, maintenance ticketing, notifications, admin analytics, QR booking passes, and deployment-ready project structure.

## Stack

- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Bean Validation, Flyway, PostgreSQL, Maven Wrapper
- Frontend: React 19, Vite, Tailwind CSS v4, React Router, Axios, Vitest
- Database: PostgreSQL in runtime, H2 for automated backend tests
- CI: GitHub Actions
- Deployment support: Dockerfiles for backend/frontend and `docker-compose.yml`

## Implemented Product Areas

- Authentication foundation
  - local email + password login
  - Google OAuth 2.0 login
  - safe Google account linking
  - disabled-account blocking
  - database-backed role resolution for `USER`, `TECHNICIAN`, and `ADMIN`
  - protected route redirects and role-aware dashboard shells
- Facilities and assets catalogue
  - resource browsing, filters, search, detail data
  - admin CRUD and status management
- Booking management
  - availability checks
  - overlap prevention with backend final conflict recheck
  - approval, rejection, and cancellation workflow
  - approved-booking QR pass generation
- Maintenance and incident ticketing
  - ticket creation, assignment, technician queue
  - status workflow enforcement
  - comments with ownership checks
  - image upload handling with limits and validation
- Notifications
  - unread count
  - inbox page
  - mark-one, mark-all, delete
  - preference controls with backend enforcement
- Admin analytics
  - overview metrics
  - booking pipeline stats
  - ticket status, category, and priority stats
  - top resources
  - SLA posture breakdown
- Product polish
  - Light, Dark, and System theme modes with persistence
  - responsive shared shell
  - backend and frontend automated tests
  - CI workflow and Docker support

## Auth-First Proof

The implementation was intentionally staged so auth and role behavior were completed before business modules:

1. `7b7ae8a` `feat: add unified auth model with role-based dashboard redirects`
2. `0548935` `feat: implement resource catalogue CRUD and filters`
3. `74282ff` `feat: implement booking conflict validation and approval workflow`
4. `9271528` `feat: implement ticket creation, comments, and technician assignment`
5. `1440a0b` `feat: add notifications and unread count handling`
6. Current `feature/notifications-analytics` work extends analytics, SLA reporting, QR booking passes, and deployment polish

That sequence is the explicit proof that Phase 1 auth, protected routes, and dashboard skeletons were completed first.

## Repository Layout

```text
.
├─ backend/
│  ├─ src/main/java/com/smartcampus/operationshub/
│  ├─ src/main/resources/db/migration/
│  ├─ src/test/java/com/smartcampus/operationshub/
│  ├─ .env.example
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  ├─ .env.example
│  ├─ Dockerfile
│  └─ nginx.conf
├─ .github/workflows/ci.yml
├─ docker-compose.yml
└─ README.md
```

## Team Ownership Structure

Feature-owned source files are grouped for the four-member split:

- Member 1:
  - `backend/src/main/java/com/smartcampus/operationshub/features/resources`
  - `frontend/src/features/resources`
- Member 2:
  - `backend/src/main/java/com/smartcampus/operationshub/features/bookings`
  - `frontend/src/features/bookings`
- Member 3:
  - `backend/src/main/java/com/smartcampus/operationshub/features/tickets`
  - `frontend/src/features/tickets`
- Member 4:
  - `backend/src/main/java/com/smartcampus/operationshub/features/access`
  - `backend/src/main/java/com/smartcampus/operationshub/features/notifications`
  - `frontend/src/features/access`
  - `frontend/src/features/notifications`

Shared foundations such as `config`, `domain`, `security`, `context`, `router`, `ui/layout`, and `ui/navigation` remain common. See [`TEAM_OWNERSHIP.md`](TEAM_OWNERSHIP.md) for the full ownership map.

## Local Setup

### 1. Prerequisites

- Java 21
- Node 20+
- PostgreSQL 16+

### 2. Configure environment files

Backend example: [`backend/.env.example`](backend/.env.example)

Frontend example: [`frontend/.env.example`](frontend/.env.example)

Recommended backend variables:

```env
DB_URL=jdbc:postgresql://localhost:5432/smart_campus_hub
DB_USERNAME=postgres
DB_PASSWORD=postgres
FRONTEND_BASE_URL=http://localhost:5173
UPLOADS_DIRECTORY=./uploads
APP_SEED_ENABLED=true
APP_SEED_USER_PASSWORD=User@12345
APP_SEED_ADMIN_PASSWORD=Admin@12345
APP_SEED_TECHNICIAN_PASSWORD=Tech@12345
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your-client-id
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your-client-secret
```

Frontend variable:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE smart_campus_hub;
```

### 4. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Flyway migrations create the schema automatically at startup.

### 5. Run the frontend

```bash
cd frontend
npm ci
npm run dev
```

The app will be available at `http://localhost:5173`.

## Google OAuth Setup

Create a Google OAuth 2.0 Web application credential and use these local values:

- Authorized JavaScript origin: `http://localhost:5173`
- Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`

Then put the values into [`backend/.env`](backend/.env):

```env
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your-google-client-id
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

You can also keep them in [`backend/.env.example`](backend/.env.example) as a reference for team setup.

If those variables are missing, the login page will now show a safe configuration message instead of sending users into a raw backend error.

Google verifies identity only. Role remains database-controlled, and users never choose a role during login.

## Seed Strategy

When `APP_SEED_ENABLED=true`, the backend seeds these accounts if they do not already exist:

- `user001 / user@smartcampus.local`
- `admin001 / admin@smartcampus.local`
- `tech001 / technician@smartcampus.local`

Passwords come from:

- `APP_SEED_USER_PASSWORD`
- `APP_SEED_ADMIN_PASSWORD`
- `APP_SEED_TECHNICIAN_PASSWORD`

Regular `USER` accounts can still self-register through the UI, but the seeded `USER` account is useful for demos, friend handoffs, and role-based testing.

## Key Routes

Public:

- `/`
- `/login`
- `/register`
- `/oauth/callback`

Protected:

- `/dashboard`
- `/technician/dashboard`
- `/admin/dashboard`
- `/catalogue`
- `/bookings/new`
- `/bookings/my`
- `/tickets/new`
- `/tickets/my`
- `/tickets/:id`
- `/technician/tickets`
- `/admin/resources`
- `/admin/bookings`
- `/admin/tickets`
- `/admin/users`
- `/admin/invitations`
- `/notifications`
- `/settings/notifications`
- `/admin/analytics`

## Automated Verification

Backend:

```bash
cd backend
./mvnw test
```

Frontend:

```bash
cd frontend
npm ci
npm test
npm run build
```

## CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

The workflow runs on `push` and `pull_request` and performs:

- Java 21 setup
- Node 20 setup
- backend tests
- backend package build
- frontend install
- frontend tests
- frontend production build

## Docker

### Start the full stack

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:4173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Before using Google OAuth in Docker, replace the placeholder Google client credentials in `docker-compose.yml`.

## Notes

- Runtime uses PostgreSQL; automated backend tests use H2 for CI portability.
- Uploaded ticket images are stored in the configured uploads directory and ignored by Git.
- No secrets are committed. Use local `.env` files or deployment environment variables.
