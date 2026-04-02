# HealthConnect

**HealthConnect** is a health-tech platform tailored for the Pakistani market, connecting patients with PMDC-verified doctors. Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, and **Firebase**.

## Vision

Create a trusted, localized healthcare ecosystem where:
- **Patients** can quickly register, search doctors by specialty/city/rating, see transparent consultation fees (PKR), and book appointments from real-time available slots.
- **Doctors** can register with PMDC verification, list clinics and locations, set availability and fees, and grow through patient ratings.
- **Reception** staff can manage queues, check-ins, and daily schedules.
- **Admins** can oversee users, verify doctors, and manage platform settings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 + shadcn/ui (project-local) |
| Icons | Lucide React |
| Auth | Firebase Auth (Phone OTP + Email/Password + verification email) |
| Backend | Firebase Admin SDK |
| Theme | next-themes (light/dark/system) |

## Features Implemented

### Architecture
- **Route group layouts** — `(public)`, `(auth)`, `(app)` with shared layouts eliminating duplicate code
- **Role-based dashboard layouts** — Patient, Doctor, Reception, Admin each have a shared layout with navigation defined once in `src/lib/navigation.ts`
- **Dark mode** — Full light/dark/system theme support via `next-themes` with CSS custom properties (oklch color space)
- **TypeScript types** — Shared interfaces for `UserProfile`, `Clinic`, `Appointment`, `MedicalRecord`, `QueueEntry` in `src/types/index.ts`
- **Error boundaries** — Global `error.tsx`, `not-found.tsx`, and route-group-specific `loading.tsx` skeletons

### UI Components
- **Button** — Multiple variants (default, destructive, outline, secondary, ghost, link) with sizes
- **Card** — Card, CardHeader, CardTitle, CardDescription, CardContent — dark mode compatible
- **Input** — Styled with focus rings and dark mode support
- **Badge** — Variants: default, secondary, destructive, outline, success, warning, info
- **Skeleton** — Animated loading placeholders
- **Sheet** — Mobile slide-out sidebar drawer
- **ThemeToggle** — Sun/moon toggle for light/dark mode
- **StatCard** — Reusable dashboard stat card with icon, value, and trend
- **PageHeader** — Reusable section header with label, title, description

### Pages

#### Public (with `PublicNavbar` + `PublicFooter` via layout)
| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, how-it-works, for-patients/for-doctors sections, CTA |
| `/search` | Doctor/clinic search with filters, demo results with ratings, fees, city |
| `/c/[clinicSlug]` | Doctor/clinic profile page with location, rating, hours |
| `/book/[clinicSlug]` | Booking form with name, phone, date |

#### Auth (centered card layout via layout)
| Route | Description |
|-------|-------------|
| `/login` | Login entry — links to combined sign-in |
| `/auth/login` | **Phone** (SMS + invisible reCAPTCHA) or **Email** (password). Session cookie via `/api/auth/session`. Optional *Resend verification email*. |
| `/register` | Patient vs Doctor, then **Phone** (continue to SMS on `/auth/login`) or **Email** (create account + `sendEmailVerification` + session). Requires **Email/Password** enabled in Firebase Console. |

#### App Portal
| Route | Description |
|-------|-------------|
| `/app` | Auth-gated portal — auto-redirects by role from Firebase claims, shows role picker if no role set |

#### Patient Dashboard (`/o/patient/...`)
| Route | Description |
|-------|-------------|
| Overview | Stat cards (upcoming, recent visits, records) + recent appointments + quick actions |
| `/book` | In-dashboard doctor search with specialty filters |
| `/appointments` | Appointment list with status badges (confirmed/completed/cancelled) |
| `/records` | Medical records (empty state) |
| `/profile` | Editable profile (name, phone, city) |

#### Doctor Dashboard (`/o/dentist/...`)
| Route | Description |
|-------|-------------|
| Overview | Stat cards (today's appointments, patients, avg rating) + today's schedule |
| `/appointments` | Appointment list with patient names, types, status badges |
| `/patients` | Patient search |
| `/reports` | Clinical reports (empty state) |
| `/profile` | Doctor profile with PMDC badge, specialty, consultation fee (PKR), city |

#### Reception Dashboard (`/o/reception/...`)
| Route | Description |
|-------|-------------|
| Overview | Stat cards (checked-in, queue, avg wait) + today's queue |
| `/queue` | Queue management with position numbers and status |
| `/appointments` | Today's appointment schedule with check-in status |
| `/messages` | Messages (empty state) |
| `/profile` | Editable profile |

#### Admin Dashboard (`/o/admin/...`)
| Route | Description |
|-------|-------------|
| Overview | Stat cards (active users, appointments, system status) + quick actions + platform health |
| `/users` | User management with search, role badges, PMDC verification badges |
| `/appointments` | All appointments across platform |
| `/analytics` | Analytics (empty state — ready for charts) |
| `/settings` | Platform settings (name, support email, active cities) |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/session` | POST | Creates Firebase session cookie (14-day expiry) |
| `/api/auth/logout` | POST | Clears session cookie |

### Middleware
- `src/middleware.ts` — Protects `/app/*` routes, redirects unauthenticated users to `/login`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, fonts, metadata)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind + CSS variables (light/dark)
│   ├── not-found.tsx           # Global 404
│   ├── error.tsx               # Global error boundary
│   ├── (public)/               # Public pages (shared Navbar/Footer layout)
│   │   ├── layout.tsx
│   │   ├── search/page.tsx
│   │   ├── c/[clinicSlug]/page.tsx
│   │   └── book/[clinicSlug]/page.tsx
│   ├── (auth)/                 # Auth pages (centered card layout)
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── auth/login/page.tsx
│   ├── (app)/                  # Authenticated app
│   │   ├── loading.tsx
│   │   ├── app/page.tsx        # Role router / portal
│   │   └── o/
│   │       ├── patient/        # layout.tsx + 5 pages
│   │       ├── dentist/        # layout.tsx + 5 pages (Doctor dashboard)
│   │       ├── reception/      # layout.tsx + 5 pages
│   │       └── admin/          # layout.tsx + 5 pages
│   └── api/auth/
│       ├── session/route.ts
│       └── logout/route.ts
├── components/
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   └── PageHeader.tsx
│   ├── layout/
│   │   ├── DashboardLayout.tsx # Sidebar + mobile sheet + theme toggle
│   │   ├── PublicNavbar.tsx     # Responsive navbar with mobile menu
│   │   └── PublicFooter.tsx
│   ├── providers/
│   │   └── ThemeProvider.tsx    # next-themes wrapper
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       └── theme-toggle.tsx
├── lib/
│   ├── navigation.ts           # Centralized nav configs for all 4 roles
│   ├── utils.ts                # cn() utility
│   └── firebase/
│       ├── client.ts
│       └── admin.ts
├── types/
│   └── index.ts                # Shared TypeScript interfaces
└── middleware.ts                # Auth route protection
```

## Local Development

### Install

```bash
npm install
```

### Environment Variables

Copy the example and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config (6 vars)
- `FIREBASE_ADMIN_*` — Firebase Admin SDK (3 vars)

**Firebase Authentication → Sign-in method:** enable **Phone** (for SMS) and **Email/Password** (for email accounts and verification links). Authorized domains must include your dev host (e.g. `localhost`).

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's Next (Not Yet Implemented)

- **Firestore integration** — Database schema designed (see `src/types/`), service layer and API routes needed
- **Real doctor search** — Connect search page to Firestore with location/specialty/rating filters
- **Slot-based booking** — Doctors set availability, patients book from real-time slots
- **PMDC verification flow** — Doctor registration with certificate upload and admin approval
- **Patient reviews** — Post-visit verified reviews with star ratings
- **Real-time queue** — Firestore `onSnapshot` for live reception queue updates
- **Notifications** — Email/SMS for appointment confirmations
- **Role-based middleware** — Verify role claims (not just auth) for `/o/*` routes
