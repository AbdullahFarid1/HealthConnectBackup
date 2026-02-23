# HealthConnect

**HealthConnect** is a role-based healthcare web application built with **Next.js App Router**, **TypeScript**, **Tailwind**, **shadcn/ui**, and **Lucide icons**.

The UI is designed to feel like a modern SaaS healthcare product: clean hierarchy, minimal content, rounded cards, soft shadows, and consistent blue/teal theming.

## Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components (project-local)
- **Firebase Auth** (phone OTP)
- **Middleware** for route protection (kept intact)

## Routes (UI)

### Public

- **`/`**: Landing page
- **`/search`**: Search (UI preview)
- **`/c/[clinicSlug]`**: Clinic profile (UI preview)
- **`/book/[clinicSlug]`**: Booking form (UI preview)

### Auth

- **`/login`**: Clean login entry page (links to OTP login)
- **`/auth/login`**: Phone OTP login (existing auth logic, improved UI)
- **`/register`**: Clean registration page (UI-only for now)

### App portal + dashboards

- **`/app`**: Portal page that attempts to redirect based on Firebase custom claims (role).  
  If role isn’t configured yet, it shows a role picker linking to dashboards.

Dashboards (shared sidebar layout):

- **Patient**: ` /o/patient ` (+ `/book`, `/appointments`, `/records`, `/profile`)
- **Doctor**: ` /o/dentist ` (+ `/patients`, `/appointments`, `/reports`, `/profile`)
- **Reception**: ` /o/reception ` (+ `/queue`, `/appointments`, `/messages`, `/profile`)
- **Admin**: ` /o/admin ` (+ `/users`, `/appointments`, `/analytics`, `/settings`)

## Authentication flow (high level)

1. User opens **`/auth/login`** and signs in using phone OTP.
2. Client posts the Firebase `idToken` to **`/api/auth/session`**, which creates a session cookie.
3. User is redirected to **`/app`**.
4. **`/app`** checks Firebase token claims on the client and redirects to the appropriate dashboard when a role claim is present.

> Note: UI changes do **not** modify Firebase config files, middleware, or backend logic.

## Local development

### Install

```bash
npm install
```

### Environment variables

Create **`.env.local`** in the project root. Minimum variables used by the existing Firebase code:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.
