# HealthConnect

HealthConnect is a Pakistan-focused healthcare marketplace that connects patients with doctors and clinic teams through role-based portals, searchable profiles, and a live appointment lifecycle.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Firebase.

## Product Vision

- Help patients discover doctors by city/specialty and book reliable appointment slots.
- Help doctors manage clinics, availability, reception staff, and appointment flow.
- Help reception staff coordinate queues and daily operations.
- Help admins monitor platform health and manage users.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 + shadcn/ui |
| Auth | Firebase Auth + Firebase session cookies |
| Backend | Firebase Admin SDK + Firestore |
| Icons | Lucide React |
| Theme | next-themes |

## What Is Implemented

### Core Architecture

- Route groups: `(public)`, `(auth)`, `(app)` with shared layouts.
- Role-based navigation and dashboard shells for patient, doctor, reception, admin.
- Shared domain types in `src/types/index.ts`.
- Middleware gate for authenticated app areas (`/o/*`, `/app/*`).
- Error and loading boundaries across route groups.

### Authentication and Session

- Phone OTP + email/password login.
- Registration flow for patient and doctor onboarding.
- Firebase session cookie creation and logout endpoint.
- Logout revokes refresh tokens server-side.

### App Features

- Real doctor search from Firestore (`/api/doctors`) with city/specialty/query filters.
- Doctor detail endpoint with clinics + availability (`/api/doctors/[doctorId]`).
- Firestore-backed user profile creation and profile updates.
- Clinic CRUD for doctors (`/api/clinics`).
- Availability management (`/api/availability`) including one-off and recurring slots.
- Receptionist invite/list/update/remove (`/api/receptionists`).
- Notification center with unread badge and mark-read actions (`/api/notifications`).

### Appointment Lifecycle

- Booking requires payment confirmation flag and validates slot availability.
- Transaction-safe slot reservation with deterministic appointment IDs.
- Payment model (simulated): consultation fee + platform fee + tax.
- Cancel/reschedule policy helpers with timezone-aware calculations (Asia/Karachi).
- Completion confirmation by doctor/patient with auto-maintenance jobs.
- Escrow lifecycle states: held, released, refunded.
- Ratings and feedback after completion.

## Route Map

### Public

- `/` landing page
- `/search` doctor search
- `/c/[clinicSlug]` doctor/clinic detail
- `/book/[clinicSlug]` booking flow

### Auth

- `/login`
- `/auth/login`
- `/register`

### App Portal

- `/app` role router / authenticated entry

### Dashboards

- Patient: `/o/patient`, `/o/patient/book`, `/o/patient/appointments`, `/o/patient/records`, `/o/patient/profile`
- Doctor: `/o/doctor`, `/o/doctor/patients`, `/o/doctor/appointments`, `/o/doctor/reports`, `/o/doctor/profile`
- Reception: `/o/reception`, `/o/reception/queue`, `/o/reception/appointments`, `/o/reception/messages`, `/o/reception/profile`
- Admin: `/o/admin`, `/o/admin/users`, `/o/admin/appointments`, `/o/admin/analytics`, `/o/admin/settings`

## API Surface

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/session` | POST | Create Firebase session cookie |
| `/api/auth/logout` | POST | Logout + refresh token revocation |
| `/api/users` | POST | Create user profile |
| `/api/users/me` | GET, PUT | Read/update current user profile |
| `/api/doctors` | GET | Search doctors |
| `/api/doctors/[doctorId]` | GET | Doctor profile + clinics + availability |
| `/api/appointments` | GET, POST, PATCH | List/book/mutate appointment state |
| `/api/clinics` | GET, POST, PUT, DELETE | Doctor clinic management |
| `/api/availability` | GET, POST, DELETE | Slot management and slot lookup |
| `/api/receptionists` | GET, POST, PUT, DELETE | Receptionist management |
| `/api/notifications` | GET, PATCH | Notification list + mark read |

## Complete Project Structure

The tree below reflects the current repository layout (excluding `node_modules`, `.next`, and `.git` internals).

```text
.
|-- .env
|-- .env.local.example
|-- .gitignore
|-- AUDIT.md
|-- components.json
|-- eslint.config.mjs
|-- LICENSE
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- PR_DESCRIPTION.md
|-- README.md
|-- Readme.txt
|-- tsconfig.json
|-- tsconfig.tsbuildinfo
|-- .vscode/
|   `-- extensions.json
|-- public/
|   |-- file.svg
|   |-- globe.svg
|   |-- next.svg
|   |-- vercel.svg
|   `-- window.svg
`-- src/
	|-- middleware.ts
	|-- app/
	|   |-- error.tsx
	|   |-- globals.css
	|   |-- layout.tsx
	|   |-- not-found.tsx
	|   |-- page.tsx
	|   |-- (app)/
	|   |   |-- loading.tsx
	|   |   |-- app/
	|   |   |   `-- page.tsx
	|   |   `-- o/
	|   |       |-- admin/
	|   |       |   |-- layout.tsx
	|   |       |   |-- page.tsx
	|   |       |   |-- analytics/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- appointments/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- settings/
	|   |       |   |   `-- page.tsx
	|   |       |   `-- users/
	|   |       |       `-- page.tsx
	|   |       |-- doctor/
	|   |       |   |-- layout.tsx
	|   |       |   |-- page.tsx
	|   |       |   |-- appointments/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- patients/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- profile/
	|   |       |   |   `-- page.tsx
	|   |       |   `-- reports/
	|   |       |       `-- page.tsx
	|   |       |-- patient/
	|   |       |   |-- layout.tsx
	|   |       |   |-- page.tsx
	|   |       |   |-- appointments/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- book/
	|   |       |   |   `-- page.tsx
	|   |       |   |-- profile/
	|   |       |   |   `-- page.tsx
	|   |       |   `-- records/
	|   |       |       `-- page.tsx
	|   |       `-- reception/
	|   |           |-- layout.tsx
	|   |           |-- page.tsx
	|   |           |-- appointments/
	|   |           |   `-- page.tsx
	|   |           |-- messages/
	|   |           |   `-- page.tsx
	|   |           |-- profile/
	|   |           |   `-- page.tsx
	|   |           `-- queue/
	|   |               `-- page.tsx
	|   |-- (auth)/
	|   |   |-- layout.tsx
	|   |   |-- loading.tsx
	|   |   |-- auth/
	|   |   |   `-- login/
	|   |   |       `-- page.tsx
	|   |   |-- login/
	|   |   |   `-- page.tsx
	|   |   `-- register/
	|   |       `-- page.tsx
	|   |-- (public)/
	|   |   |-- layout.tsx
	|   |   |-- book/
	|   |   |   `-- [clinicSlug]/
	|   |   |       `-- page.tsx
	|   |   |-- c/
	|   |   |   `-- [clinicSlug]/
	|   |   |       `-- page.tsx
	|   |   `-- search/
	|   |       `-- page.tsx
	|   `-- api/
	|       |-- appointments/
	|       |   `-- route.ts
	|       |-- auth/
	|       |   |-- logout/
	|       |   |   `-- route.ts
	|       |   `-- session/
	|       |       `-- route.ts
	|       |-- availability/
	|       |   `-- route.ts
	|       |-- clinics/
	|       |   `-- route.ts
	|       |-- doctors/
	|       |   |-- route.ts
	|       |   `-- [doctorId]/
	|       |       `-- route.ts
	|       |-- notifications/
	|       |   `-- route.ts
	|       |-- receptionists/
	|       |   `-- route.ts
	|       `-- users/
	|           |-- route.ts
	|           `-- me/
	|               `-- route.ts
	|-- components/
	|   |-- appointments/
	|   |   `-- AppointmentActions.tsx
	|   |-- dashboard/
	|   |   |-- PageHeader.tsx
	|   |   `-- StatCard.tsx
	|   |-- doctor/
	|   |   `-- DoctorCard.tsx
	|   |-- layout/
	|   |   |-- DashboardLayout.tsx
	|   |   |-- PublicFooter.tsx
	|   |   `-- PublicNavbar.tsx
	|   |-- notifications/
	|   |   `-- NotificationBell.tsx
	|   |-- providers/
	|   |   `-- ThemeProvider.tsx
	|   `-- ui/
	|       |-- badge.tsx
	|       |-- button.tsx
	|       |-- card.tsx
	|       |-- input.tsx
	|       |-- sheet.tsx
	|       |-- skeleton.tsx
	|       `-- theme-toggle.tsx
	|-- lib/
	|   |-- fees.ts
	|   |-- navigation.ts
	|   |-- policy.ts
	|   |-- utils.ts
	|   `-- firebase/
	|       |-- admin.ts
	|       |-- client.ts
	|       `-- firestore.ts
	`-- types/
		`-- index.ts
```

### Structure Legend

- `src/app` — Next.js App Router pages, route groups, and API route handlers.
- `src/components` — Reusable UI and domain components (dashboard, doctor, notifications, appointment actions).
- `src/lib` — Shared business logic and utilities (fees, policy rules, navigation, Firebase service layer).
- `src/types` — Shared TypeScript domain types and interfaces.
- `public` — Static assets served directly by Next.js.
- `.vscode` — Workspace/editor recommendations.
- Root config files (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`) — build, typing, linting, and styling configuration.

## Data Model Highlights

- Role collections: patients, doctors, receptionists, admins.
- Appointment model includes payment, completion confirmations, reschedule history, ratings.
- Availability supports recurring weekly or specific-date one-off blocks.
- Clinic model supports map links for location.

## Local Development

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `.env.local` and provide:

- `NEXT_PUBLIC_FIREBASE_*` (client config)
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

In Firebase Console:

- Enable Authentication providers used by the app (Phone and Email/Password).
- Create Firestore database.

### 3) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Current Gaps / Next Milestones

- PMDC verification workflow with document upload and admin approval.
- Production-grade payment provider integration (current flow is simulated).
- More complete admin analytics backed by aggregated live data.
- End-to-end automated test suite (integration + E2E).
- Additional hardening and policy enforcement tasks tracked in `AUDIT.md`.
