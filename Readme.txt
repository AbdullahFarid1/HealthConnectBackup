HealthConnect — Project Summary
What It Is
HealthConnect is a Pakistani healthcare marketplace platform — think of it as a "Doctolib" or "Zocdoc" tailored for Pakistan. It connects patients with verified doctors/dentists, enables slot-based appointment booking, and provides role-based dashboards for patients, doctors, receptionists, and platform admins.
________________________________________
Tech Stack
Layer	Tech
Framework	Next.js 16 (App Router, Turbopack, React Compiler)
Language	TypeScript 5
UI	Tailwind CSS 4 + shadcn/ui, Lucide icons
Auth	Firebase Auth (Phone OTP + Email/Password)
Backend	Firebase Admin SDK (server-side sessions)
Theme	next-themes (light/dark/system), oklch color space
Fonts	Geist Sans + Geist Mono
________________________________________
What's Built (Current State)
The frontend is essentially complete for an MVP. Here's what exists:
1.	Landing Page — Hero, "How it works" steps, patient/doctor value props, platform stats, CTAs
2.	Authentication System (fully functional)
o	Phone OTP sign-in via Firebase + invisible reCAPTCHA
o	Email/password sign-in with email verification
o	Registration with role selection (patient vs doctor)
o	14-day httpOnly session cookies
o	Doctor registration collects PMDC number + specialty
3.	4 Role-Based Dashboards, each with sidebar navigation, mobile drawer, and themed UI:
Role	Pages
Patient	Overview, Book Doctor, Appointments, Medical Records, Profile
Doctor/Dentist	Overview, Appointments, Patients, Reports, Profile
Reception	Overview, Queue Management, Appointments, Messages, Profile
Admin	Overview, User Management, Appointments, Analytics, Settings
4.	Public Pages — Doctor search (with specialty filters), clinic profile pages, booking form
5.	Component Library — Badge (7 variants), Button (6 variants + sizes), Card, Input, Sheet (mobile drawer), Skeleton loaders, ThemeToggle
6.	Data Models defined in types/index.ts — UserProfile, Clinic, Appointment, MedicalRecord, QueueEntry with proper status enums
________________________________________
What's NOT Built Yet (The Gaps)
This is where the project currently sits at a "beautiful shell" stage — the UI is polished but the backend data layer is missing:
Gap	Detail
No database connected	Firestore schemas are designed in TypeScript but nothing reads/writes to Firestore yet
All data is hardcoded	Search results, dashboard stats, appointment lists — all demo data
No real booking flow	The booking form submits nowhere; no doctor availability/slot system
No PMDC verification	Accepts the number at registration but no upload, validation, or admin approval workflow
No review system	Mentioned in marketing copy but not implemented at all
No real-time features	Queue management, notifications, live updates — all static
No payments	Consultation fees shown in PKR but no JazzCash/Stripe integration
No middleware role-guarding	A patient could manually navigate to /o/admin/ — no server-side role checks on routes
No tests	Zero unit or integration tests
No CI/CD	No GitHub Actions, no deployment pipeline
________________________________________
Potential Next Steps (Prioritized Roadmap)
Phase 1 — Make It Real (Core Backend)
1.	Set up Firestore collections matching the existing TypeScript schemas
2.	Build API routes for CRUD operations (doctors, appointments, patients)
3.	Wire up doctor search with real Firestore queries (by city, specialty)
4.	Implement slot-based booking — doctors set availability, patients pick slots
5.	Add server-side role middleware so routes are properly protected
Phase 2 — Trust & Verification 
6. PMDC verification workflow — doctor uploads certificate, admin reviews/approves 
7. Patient review system — post-appointment ratings + written reviews 
8. Email/SMS confirmations for bookings (SendGrid or Twilio)
Phase 3 — Real-Time & Operations 
9. Firestore real-time listeners for queue management and appointment updates 
10. Notification system — in-app + push notifications 
11. Reception queue — live check-in/check-out flow
Phase 4 — Monetization & Scale 12. Payment integration — JazzCash / Easypaisa / Stripe for PKR transactions 
13. Analytics dashboard — real data for admin (appointments/day, revenue, etc.) 
14. Google Maps integration for clinic locations 
. Image uploads — doctor photos, clinic photos, medical documents
Phase 5 — Production Readiness 
16. Comprehensive test suite (unit + integration + E2E) 
17. CI/CD pipeline with GitHub Actions 
18. Deploy to Vercel with production Firebase config 
19. Accessibility audit (ARIA labels, keyboard nav, screen reader support) 
20. Performance optimization — pagination, lazy loading, image optimization
________________________________________
Bottom Line
You have a well-structured, clean, modern frontend with solid architecture choices (App Router, proper route groups, centralized nav config, shared types, reusable components). The auth system works. The UI is responsive with dark mode. The foundation is strong.
The main work ahead is connecting the backend — once Firestore is wired up and real data flows through the existing UI, you'll have a functional product. The TypeScript interfaces already mirror what Firestore collections should look like, so the path from here to a working MVP is straightforward.

UPDATE:
---- STEP 1 ----
What I Built (Phase 1 Complete)
New Files Created
File	Purpose
firestore.ts
Server-side Firestore service layer — all CRUD for users, doctors, appointments
api/users/route.ts
POST /api/users — creates user profile in Firestore + sets custom claims (role)
api/users/me/route.ts
GET/PUT /api/users/me — read & update current user's profile
api/doctors/route.ts
GET /api/doctors?specialty=X&city=Y&q=Z — search doctors
api/appointments/route.ts
POST /api/appointments (book) + GET /api/appointments (list)
middleware.ts
Route protection — redirects unauthenticated users from /o/* and /app to /login
Files Modified
File	What Changed
types/index.ts
Added UserProfileDoc, AppointmentStatus, extended Appointment with names/type/updatedAt
firebase/client.ts
Added getFirestore export (db)
register/page.tsx
After email registration, calls POST /api/users to save profile to Firestore
auth/login/page.tsx
After OTP/email login, reads sessionStorage pending profile and saves to Firestore
search/page.tsx
Now queries /api/doctors — real search with specialty filters
book/[clinicSlug]/page.tsx
Real booking flow — time slot picker, calls POST /api/appointments, success screen
patient/page.tsx
Dashboard pulls real appointment data from /api/appointments
patient/appointments/page.tsx
Lists real appointments
patient/profile/page.tsx
Loads & saves profile via /api/users/me
patient/book/page.tsx
Real doctor search + book flow
dentist/page.tsx
Dashboard with real stats (today's appointments, patients)
dentist/appointments/page.tsx
Lists real appointments
dentist/patients/page.tsx
Derives patient list from appointments data
dentist/profile/page.tsx
Loads & saves doctor profile (specialty, fee, city)
________________________________________
What You Need To Do (Firebase Console)
1. Enable Firestore Database
Go to Firebase Console -> your project -> Firestore Database -> Create database
•	Choose Start in test mode (for development)
•	Pick the closest region (e.g. asia-south1 for Pakistan)
2. Create Firestore Indexes
Firestore will auto-prompt you to create these when queries first run, but you can create them proactively:
•	Collection: appointments — Composite index: patientId (ASC) + date (DESC)
•	Collection: appointments — Composite index: dentistId (ASC) + date (DESC)
•	Collection: appointments — Composite index: dentistId (ASC) + date (ASC) + createdAt (DESC)
•	Collection: users — Composite index: role (ASC) + specialty (ASC)
•	Collection: users — Composite index: role (ASC) + city (ASC)
The entire data layer is now wired up. All dashboard pages, search, booking, and profiles read/write to Firestore for real.

UPDATE:
What's Done Firestore service layer at src/lib/firebase/firestore.ts — has clean() helper that strips undefined values before writing (was causing the clinicId error) Types at src/types/index.ts — extended with ClinicDoc, AvailabilityDoc, SlotDuration, receptionist fields on UserProfileDoc API routes built: POST/GET /api/users + GET/PUT /api/users/me — profile CRUD GET /api/doctors + GET /api/doctors/[doctorId] — search + detail (returns doctor + clinics + availability) POST/GET /api/appointments — book + list (now requires clinicId) GET/POST/PUT/DELETE /api/clinics — doctor's clinic management GET/POST/DELETE /api/availability — slot config per clinic/day, also generates available slots for a date (minus booked ones) GET/POST/PUT/DELETE /api/receptionists — invite (creates Firebase Auth user with temp password), list, update, remove DashboardLayout updated at src/components/layout/DashboardLayout.tsx — now shows "Welcome, {User}" in sidebar + mobile top bar, has logout button in mobile top bar, "Home" link goes to dashboard root Registration flow wired — both phone OTP and email paths call POST /api/users after auth to save profile to Firestore + set custom claims Patient dashboard pages wired to real data (overview, appointments, profile, book) Doctor dashboard pages wired to real data (overview, appointments, patients, profile) Middleware at src/middleware.ts — redirects unauthenticated users from /o/* and /app to /login DoctorCard component created at src/components/doctor/DoctorCard.tsx — has View Details + Book buttons, city, fee, "New" badge (for doctors with no ratings)
UPDATE:

Completed Changes
1. Search Pages — DoctorCard Wired In
•	search/page.tsx — Replaced inline card JSX with <DoctorCard>, removed unused imports
•	patient/book/page.tsx — Same treatment
2. Booking Page — Clinic Selection + Dynamic Slots
•	book/[clinicSlug]/page.tsx — Now:
o	Fetches doctor + clinics via GET /api/doctors/[doctorId]
o	Shows clinic dropdown (if multiple) or auto-selects single clinic
o	Fetches available slots from GET /api/availability?doctorId=X&date=Y when date changes (no more hardcoded slots)
o	Sends clinicId in the POST body (fixes the Firestore clinicId undefined error)
3. Doctor Detail Page — Real Data
•	c/[clinicSlug]/page.tsx — Now a client component that fetches from /api/doctors/[doctorId] and displays real profile, clinics with addresses, and availability schedule
4. Doctor Profile — Full Management
•	dentist/profile/page.tsx — Rebuilt with:
o	Profile info: name, PMDC, specialty, fee, city, bio (2-col grid)
o	Clinic Management: Add/Edit/Remove clinics (name, address, city, phone). Delete blocked if only 1 clinic remains
o	Availability: Per-clinic, per-day, start/end time + slot duration (15/30/45/60 min). Upserts existing blocks
o	Receptionists: Invite with name/email/phone + clinic assignment dropdown. Shows temp password after creation. Displays Invited/Joined status. Remove button
5. Doctor Dashboard — Profile Completion
•	dentist/page.tsx — Now shows:
o	Profile completion % with progress bar (checks: name, specialty, PMDC, city, fee, 1+ clinic, 1+ availability)
o	"Complete Profile" button linking to /o/dentist/profile — disappears at 100%
o	Green "Profile complete" banner when done
________________________________________
Firebase Console Tasks (your responsibility)
You need to create these composite indexes in Firestore:
Collection	Fields	Order
appointments	patientId ASC, date DESC	
appointments	dentistId ASC, date DESC	
clinics	doctorId ASC, createdAt ASC	
availability	clinicId ASC, dayOfWeek ASC	
availability	doctorId ASC, dayOfWeek ASC	
users	role ASC, invitedByDoctorId ASC	
Tip: Firestore will auto-suggest these indexes in the browser console error links when you first hit those queries — just click the links and they'll be created for you.

UPDATE:

1. Profile Overwrite Bug (Critical) - Fixed
•	Firestore now uses separate collections per role: patients, doctors, receptionists, admins instead of a single users collection
•	createUserProfile() checks for existing documents before writing, preventing overwrites
•	getUserProfile() searches role-specific collections, with automatic migration from the legacy users collection
2. Receptionist Invitation - Fixed
•	Receptionist profiles are now written to the receptionists collection (not users)
•	Added error display in the invite form so doctors see failure reasons
•	Login flow already handles receptionist sign-in correctly (session + redirect via custom claims)
•	Improved the credential-sharing UI text
3. Slot Creation UX - Improved
•	Replaced single-day dropdown with multi-day toggle buttons
•	Added an "Everyday" button that selects/deselects all 7 days
•	API now accepts daysOfWeek: number[] array and creates slots for all selected days in one request
•	Button label shows count (e.g., "Add Slots (3 days)")
4. "Dentist" -> "Doctor" Refactor - Complete
•	types/index.ts: UserRole now uses "doctor" not "dentist", added USER_ROLES constants and ROLE_COLLECTIONS map
•	Appointment interface: dentistId/dentistName renamed to doctorId/doctorName
•	Routes renamed: /o/dentist/* -> /o/doctor/*
•	navigation.ts: dentistNav -> doctorNav with /o/doctor paths
•	All API routes updated. Legacy "dentist" values accepted for backward compatibility during migration
•	Old dentist route directory deleted
5. Firestore Structure - Refactored
•	Separate collections: patients, doctors, receptionists, admins
•	getUserProfile() auto-migrates legacy users collection records on first access
•	All queries updated to target role-specific collections
6. Patient Notes Visible to Doctor - Fixed
•	Doctor's appointments page now displays apt.notes when present
•	Doctor's dashboard page today's schedule also shows notes
•	Notes were already stored in appointment documents; the issue was display-only
7. Past Date Booking Validation - Added
•	Backend: appointments API rejects bookings where date < today
•	Backend: availability API returns empty slots for past dates and filters out already-passed time slots for today
•	Frontend: The booking page already had min={today} on the date input

Backend / security
•	src/app/api/auth/logout/route.ts — verifies the session cookie and calls admin.auth().revokeRefreshTokens() so refresh tokens are invalidated, not just the cookie.
•	src/lib/firebase/firestore.ts — createAppointment now uses a deterministic doc ID ({doctorId}_{date}_{slotKey}) inside a runTransaction that reads any same-doctor/date/slot docs and rejects with SlotAlreadyBookedError if a non-cancelled booking already exists. Race-safe.
•	New todayInAppTz, dayOfWeekForDate, isValidDateString helpers anchor all dates to Asia/Karachi (the project is Pakistan-only). generateSlots, the appointments POST, and the availability GET all use them, replacing string/local parsing.
•	src/app/api/appointments/route.ts — validates date format, validates the requested timeSlot is actually a generated slot for that date, runs a pre-check for booked slots, and maps SlotAlreadyBookedError → 409.
•	Functional
•	Availability validation: src/app/api/availability/route.ts rejects HH:mm format errors, endTime ≤ startTime, and ranges shorter than the chosen slot duration. Clear "End time must be later than start time" error.
•	Multiple blocks per day: setAvailability no longer upserts on doctor+clinic+day — it always inserts. New findOverlappingAvailability blocks only true time overlaps, so e.g. 3-5pm and 7-10pm on Monday are both accepted.
•	Recurring is now opt-in: AvailabilityDoc.repeatWeekly (default false in the UI) + specificDate. The Add Availability form has a "Repeat weekly" checkbox; when off it shows a date picker for a one-off slot. generateSlots matches one-offs by exact date, recurring by weekday. Existing legacy docs (no field) default to recurring so they keep working.
•	Doctor profile picture: optional photoUrl on UserProfileDoc, editable in src/app/(app)/o/doctor/profile/page.tsx with a live preview, allowed through PUT /api/users/me, rendered on src/components/doctor/DoctorCard.tsx.
•	Clinic location: latitude, longitude, mapUrl on ClinicDoc (all optional, range-validated in src/app/api/clinics/route.ts). Doctor profile clinic form has lat/lng/Maps-link inputs; existing clinic cards show a "View on Google Maps" link when set.
•	npx tsc --noEmit is clean.
UPDATE:
All issues resolved. Summary:
Backend / security
•	src/app/api/auth/logout/route.ts — verifies the session cookie and calls admin.auth().revokeRefreshTokens() so refresh tokens are invalidated, not just the cookie.
•	src/lib/firebase/firestore.ts — createAppointment now uses a deterministic doc ID ({doctorId}_{date}_{slotKey}) inside a runTransaction that reads any same-doctor/date/slot docs and rejects with SlotAlreadyBookedError if a non-cancelled booking already exists. Race-safe.
•	New todayInAppTz, dayOfWeekForDate, isValidDateString helpers anchor all dates to Asia/Karachi (the project is Pakistan-only). generateSlots, the appointments POST, and the availability GET all use them, replacing string/local parsing.
•	src/app/api/appointments/route.ts — validates date format, validates the requested timeSlot is actually a generated slot for that date, runs a pre-check for booked slots, and maps SlotAlreadyBookedError → 409.
Functional
•	Availability validation: src/app/api/availability/route.ts rejects HH:mm format errors, endTime ≤ startTime, and ranges shorter than the chosen slot duration. Clear "End time must be later than start time" error.
•	Multiple blocks per day: setAvailability no longer upserts on doctor+clinic+day — it always inserts. New findOverlappingAvailability blocks only true time overlaps, so e.g. 3-5pm and 7-10pm on Monday are both accepted.
•	Recurring is now opt-in: AvailabilityDoc.repeatWeekly (default false in the UI) + specificDate. The Add Availability form has a "Repeat weekly" checkbox; when off it shows a date picker for a one-off slot. generateSlots matches one-offs by exact date, recurring by weekday. Existing legacy docs (no field) default to recurring so they keep working.
•	Doctor profile picture: optional photoUrl on UserProfileDoc, editable in src/app/(app)/o/doctor/profile/page.tsx with a live preview, allowed through PUT /api/users/me, rendered on src/components/doctor/DoctorCard.tsx.
•	Clinic location: latitude, longitude, mapUrl on ClinicDoc (all optional, range-validated in src/app/api/clinics/route.ts). Doctor profile clinic form has lat/lng/Maps-link inputs; existing clinic cards show a "View on Google Maps" link when set.
npx tsc --noEmit is clean.


HealthConnect — Project Summary
What It Is
HealthConnect is a Pakistani healthcare marketplace platform — think of it as a "Doctolib" or "Zocdoc" tailored for Pakistan. It connects patients with verified doctors/dentists, enables slot-based appointment booking, and provides role-based dashboards for patients, doctors, receptionists, and platform admins.
________________________________________
Tech Stack
Layer	Tech
Framework	Next.js 16 (App Router, Turbopack, React Compiler)
Language	TypeScript 5
UI	Tailwind CSS 4 + shadcn/ui, Lucide icons
Auth	Firebase Auth (Phone OTP + Email/Password)
Backend	Firebase Admin SDK (server-side sessions)
Theme	next-themes (light/dark/system), oklch color space
Fonts	Geist Sans + Geist Mono
________________________________________
What's Built (Current State)
The frontend is essentially complete for an MVP. Here's what exists:
1.	Landing Page — Hero, "How it works" steps, patient/doctor value props, platform stats, CTAs
2.	Authentication System (fully functional)
o	Phone OTP sign-in via Firebase + invisible reCAPTCHA
o	Email/password sign-in with email verification
o	Registration with role selection (patient vs doctor)
o	14-day httpOnly session cookies
o	Doctor registration collects PMDC number + specialty
3.	4 Role-Based Dashboards, each with sidebar navigation, mobile drawer, and themed UI:
Role	Pages
Patient	Overview, Book Doctor, Appointments, Medical Records, Profile
Doctor/Dentist	Overview, Appointments, Patients, Reports, Profile
Reception	Overview, Queue Management, Appointments, Messages, Profile
Admin	Overview, User Management, Appointments, Analytics, Settings
4.	Public Pages — Doctor search (with specialty filters), clinic profile pages, booking form
5.	Component Library — Badge (7 variants), Button (6 variants + sizes), Card, Input, Sheet (mobile drawer), Skeleton loaders, ThemeToggle
6.	Data Models defined in types/index.ts — UserProfile, Clinic, Appointment, MedicalRecord, QueueEntry with proper status enums
________________________________________
What's NOT Built Yet (The Gaps)
This is where the project currently sits at a "beautiful shell" stage — the UI is polished but the backend data layer is missing:
Gap	Detail
No database connected	Firestore schemas are designed in TypeScript but nothing reads/writes to Firestore yet
All data is hardcoded	Search results, dashboard stats, appointment lists — all demo data
No real booking flow	The booking form submits nowhere; no doctor availability/slot system
No PMDC verification	Accepts the number at registration but no upload, validation, or admin approval workflow
No review system	Mentioned in marketing copy but not implemented at all
No real-time features	Queue management, notifications, live updates — all static
No payments	Consultation fees shown in PKR but no JazzCash/Stripe integration
No middleware role-guarding	A patient could manually navigate to /o/admin/ — no server-side role checks on routes
No tests	Zero unit or integration tests
No CI/CD	No GitHub Actions, no deployment pipeline
________________________________________
Potential Next Steps (Prioritized Roadmap)
Phase 1 — Make It Real (Core Backend)
1.	Set up Firestore collections matching the existing TypeScript schemas
2.	Build API routes for CRUD operations (doctors, appointments, patients)
3.	Wire up doctor search with real Firestore queries (by city, specialty)
4.	Implement slot-based booking — doctors set availability, patients pick slots
5.	Add server-side role middleware so routes are properly protected
Phase 2 — Trust & Verification 
6. PMDC verification workflow — doctor uploads certificate, admin reviews/approves 
7. Patient review system — post-appointment ratings + written reviews 
8. Email/SMS confirmations for bookings (SendGrid or Twilio)
Phase 3 — Real-Time & Operations 
9. Firestore real-time listeners for queue management and appointment updates 
10. Notification system — in-app + push notifications 
11. Reception queue — live check-in/check-out flow
Phase 4 — Monetization & Scale 12. Payment integration — JazzCash / Easypaisa / Stripe for PKR transactions 
13. Analytics dashboard — real data for admin (appointments/day, revenue, etc.) 
14. Google Maps integration for clinic locations 
. Image uploads — doctor photos, clinic photos, medical documents
Phase 5 — Production Readiness 
16. Comprehensive test suite (unit + integration + E2E) 
17. CI/CD pipeline with GitHub Actions 
18. Deploy to Vercel with production Firebase config 
19. Accessibility audit (ARIA labels, keyboard nav, screen reader support) 
20. Performance optimization — pagination, lazy loading, image optimization
________________________________________
Bottom Line
You have a well-structured, clean, modern frontend with solid architecture choices (App Router, proper route groups, centralized nav config, shared types, reusable components). The auth system works. The UI is responsive with dark mode. The foundation is strong.
The main work ahead is connecting the backend — once Firestore is wired up and real data flows through the existing UI, you'll have a functional product. The TypeScript interfaces already mirror what Firestore collections should look like, so the path from here to a working MVP is straightforward.

UPDATE:
---- STEP 1 ----
What I Built (Phase 1 Complete)
New Files Created
File	Purpose
firestore.ts
Server-side Firestore service layer — all CRUD for users, doctors, appointments
api/users/route.ts
POST /api/users — creates user profile in Firestore + sets custom claims (role)
api/users/me/route.ts
GET/PUT /api/users/me — read & update current user's profile
api/doctors/route.ts
GET /api/doctors?specialty=X&city=Y&q=Z — search doctors
api/appointments/route.ts
POST /api/appointments (book) + GET /api/appointments (list)
middleware.ts
Route protection — redirects unauthenticated users from /o/* and /app to /login
Files Modified
File	What Changed
types/index.ts
Added UserProfileDoc, AppointmentStatus, extended Appointment with names/type/updatedAt
firebase/client.ts
Added getFirestore export (db)
register/page.tsx
After email registration, calls POST /api/users to save profile to Firestore
auth/login/page.tsx
After OTP/email login, reads sessionStorage pending profile and saves to Firestore
search/page.tsx
Now queries /api/doctors — real search with specialty filters
book/[clinicSlug]/page.tsx
Real booking flow — time slot picker, calls POST /api/appointments, success screen
patient/page.tsx
Dashboard pulls real appointment data from /api/appointments
patient/appointments/page.tsx
Lists real appointments
patient/profile/page.tsx
Loads & saves profile via /api/users/me
patient/book/page.tsx
Real doctor search + book flow
dentist/page.tsx
Dashboard with real stats (today's appointments, patients)
dentist/appointments/page.tsx
Lists real appointments
dentist/patients/page.tsx
Derives patient list from appointments data
dentist/profile/page.tsx
Loads & saves doctor profile (specialty, fee, city)
________________________________________
What You Need To Do (Firebase Console)
1. Enable Firestore Database
Go to Firebase Console -> your project -> Firestore Database -> Create database
•	Choose Start in test mode (for development)
•	Pick the closest region (e.g. asia-south1 for Pakistan)
2. Create Firestore Indexes
Firestore will auto-prompt you to create these when queries first run, but you can create them proactively:
•	Collection: appointments — Composite index: patientId (ASC) + date (DESC)
•	Collection: appointments — Composite index: dentistId (ASC) + date (DESC)
•	Collection: appointments — Composite index: dentistId (ASC) + date (ASC) + createdAt (DESC)
•	Collection: users — Composite index: role (ASC) + specialty (ASC)
•	Collection: users — Composite index: role (ASC) + city (ASC)
The entire data layer is now wired up. All dashboard pages, search, booking, and profiles read/write to Firestore for real.

UPDATE:
What's Done Firestore service layer at src/lib/firebase/firestore.ts — has clean() helper that strips undefined values before writing (was causing the clinicId error) Types at src/types/index.ts — extended with ClinicDoc, AvailabilityDoc, SlotDuration, receptionist fields on UserProfileDoc API routes built: POST/GET /api/users + GET/PUT /api/users/me — profile CRUD GET /api/doctors + GET /api/doctors/[doctorId] — search + detail (returns doctor + clinics + availability) POST/GET /api/appointments — book + list (now requires clinicId) GET/POST/PUT/DELETE /api/clinics — doctor's clinic management GET/POST/DELETE /api/availability — slot config per clinic/day, also generates available slots for a date (minus booked ones) GET/POST/PUT/DELETE /api/receptionists — invite (creates Firebase Auth user with temp password), list, update, remove DashboardLayout updated at src/components/layout/DashboardLayout.tsx — now shows "Welcome, {User}" in sidebar + mobile top bar, has logout button in mobile top bar, "Home" link goes to dashboard root Registration flow wired — both phone OTP and email paths call POST /api/users after auth to save profile to Firestore + set custom claims Patient dashboard pages wired to real data (overview, appointments, profile, book) Doctor dashboard pages wired to real data (overview, appointments, patients, profile) Middleware at src/middleware.ts — redirects unauthenticated users from /o/* and /app to /login DoctorCard component created at src/components/doctor/DoctorCard.tsx — has View Details + Book buttons, city, fee, "New" badge (for doctors with no ratings)
UPDATE:

Completed Changes
1. Search Pages — DoctorCard Wired In
•	search/page.tsx — Replaced inline card JSX with <DoctorCard>, removed unused imports
•	patient/book/page.tsx — Same treatment
2. Booking Page — Clinic Selection + Dynamic Slots
•	book/[clinicSlug]/page.tsx — Now:
o	Fetches doctor + clinics via GET /api/doctors/[doctorId]
o	Shows clinic dropdown (if multiple) or auto-selects single clinic
o	Fetches available slots from GET /api/availability?doctorId=X&date=Y when date changes (no more hardcoded slots)
o	Sends clinicId in the POST body (fixes the Firestore clinicId undefined error)
3. Doctor Detail Page — Real Data
•	c/[clinicSlug]/page.tsx — Now a client component that fetches from /api/doctors/[doctorId] and displays real profile, clinics with addresses, and availability schedule
4. Doctor Profile — Full Management
•	dentist/profile/page.tsx — Rebuilt with:
o	Profile info: name, PMDC, specialty, fee, city, bio (2-col grid)
o	Clinic Management: Add/Edit/Remove clinics (name, address, city, phone). Delete blocked if only 1 clinic remains
o	Availability: Per-clinic, per-day, start/end time + slot duration (15/30/45/60 min). Upserts existing blocks
o	Receptionists: Invite with name/email/phone + clinic assignment dropdown. Shows temp password after creation. Displays Invited/Joined status. Remove button
5. Doctor Dashboard — Profile Completion
•	dentist/page.tsx — Now shows:
o	Profile completion % with progress bar (checks: name, specialty, PMDC, city, fee, 1+ clinic, 1+ availability)
o	"Complete Profile" button linking to /o/dentist/profile — disappears at 100%
o	Green "Profile complete" banner when done
________________________________________
Firebase Console Tasks (your responsibility)
You need to create these composite indexes in Firestore:
Collection	Fields	Order
appointments	patientId ASC, date DESC	
appointments	dentistId ASC, date DESC	
clinics	doctorId ASC, createdAt ASC	
availability	clinicId ASC, dayOfWeek ASC	
availability	doctorId ASC, dayOfWeek ASC	
users	role ASC, invitedByDoctorId ASC	
Tip: Firestore will auto-suggest these indexes in the browser console error links when you first hit those queries — just click the links and they'll be created for you.

UPDATE:

1. Profile Overwrite Bug (Critical) - Fixed
•	Firestore now uses separate collections per role: patients, doctors, receptionists, admins instead of a single users collection
•	createUserProfile() checks for existing documents before writing, preventing overwrites
•	getUserProfile() searches role-specific collections, with automatic migration from the legacy users collection
2. Receptionist Invitation - Fixed
•	Receptionist profiles are now written to the receptionists collection (not users)
•	Added error display in the invite form so doctors see failure reasons
•	Login flow already handles receptionist sign-in correctly (session + redirect via custom claims)
•	Improved the credential-sharing UI text
3. Slot Creation UX - Improved
•	Replaced single-day dropdown with multi-day toggle buttons
•	Added an "Everyday" button that selects/deselects all 7 days
•	API now accepts daysOfWeek: number[] array and creates slots for all selected days in one request
•	Button label shows count (e.g., "Add Slots (3 days)")
4. "Dentist" -> "Doctor" Refactor - Complete
•	types/index.ts: UserRole now uses "doctor" not "dentist", added USER_ROLES constants and ROLE_COLLECTIONS map
•	Appointment interface: dentistId/dentistName renamed to doctorId/doctorName
•	Routes renamed: /o/dentist/* -> /o/doctor/*
•	navigation.ts: dentistNav -> doctorNav with /o/doctor paths
•	All API routes updated. Legacy "dentist" values accepted for backward compatibility during migration
•	Old dentist route directory deleted
5. Firestore Structure - Refactored
•	Separate collections: patients, doctors, receptionists, admins
•	getUserProfile() auto-migrates legacy users collection records on first access
•	All queries updated to target role-specific collections
6. Patient Notes Visible to Doctor - Fixed
•	Doctor's appointments page now displays apt.notes when present
•	Doctor's dashboard page today's schedule also shows notes
•	Notes were already stored in appointment documents; the issue was display-only
7. Past Date Booking Validation - Added
•	Backend: appointments API rejects bookings where date < today
•	Backend: availability API returns empty slots for past dates and filters out already-passed time slots for today
•	Frontend: The booking page already had min={today} on the date input

Backend / security
•	src/app/api/auth/logout/route.ts — verifies the session cookie and calls admin.auth().revokeRefreshTokens() so refresh tokens are invalidated, not just the cookie.
•	src/lib/firebase/firestore.ts — createAppointment now uses a deterministic doc ID ({doctorId}_{date}_{slotKey}) inside a runTransaction that reads any same-doctor/date/slot docs and rejects with SlotAlreadyBookedError if a non-cancelled booking already exists. Race-safe.
•	New todayInAppTz, dayOfWeekForDate, isValidDateString helpers anchor all dates to Asia/Karachi (the project is Pakistan-only). generateSlots, the appointments POST, and the availability GET all use them, replacing string/local parsing.
•	src/app/api/appointments/route.ts — validates date format, validates the requested timeSlot is actually a generated slot for that date, runs a pre-check for booked slots, and maps SlotAlreadyBookedError → 409.
•	Functional
•	Availability validation: src/app/api/availability/route.ts rejects HH:mm format errors, endTime ≤ startTime, and ranges shorter than the chosen slot duration. Clear "End time must be later than start time" error.
•	Multiple blocks per day: setAvailability no longer upserts on doctor+clinic+day — it always inserts. New findOverlappingAvailability blocks only true time overlaps, so e.g. 3-5pm and 7-10pm on Monday are both accepted.
•	Recurring is now opt-in: AvailabilityDoc.repeatWeekly (default false in the UI) + specificDate. The Add Availability form has a "Repeat weekly" checkbox; when off it shows a date picker for a one-off slot. generateSlots matches one-offs by exact date, recurring by weekday. Existing legacy docs (no field) default to recurring so they keep working.
•	Doctor profile picture: optional photoUrl on UserProfileDoc, editable in src/app/(app)/o/doctor/profile/page.tsx with a live preview, allowed through PUT /api/users/me, rendered on src/components/doctor/DoctorCard.tsx.
•	Clinic location: latitude, longitude, mapUrl on ClinicDoc (all optional, range-validated in src/app/api/clinics/route.ts). Doctor profile clinic form has lat/lng/Maps-link inputs; existing clinic cards show a "View on Google Maps" link when set.
•	npx tsc --noEmit is clean.
UPDATE:
All issues resolved. Summary:
Backend / security
•	src/app/api/auth/logout/route.ts — verifies the session cookie and calls admin.auth().revokeRefreshTokens() so refresh tokens are invalidated, not just the cookie.
•	src/lib/firebase/firestore.ts — createAppointment now uses a deterministic doc ID ({doctorId}_{date}_{slotKey}) inside a runTransaction that reads any same-doctor/date/slot docs and rejects with SlotAlreadyBookedError if a non-cancelled booking already exists. Race-safe.
•	New todayInAppTz, dayOfWeekForDate, isValidDateString helpers anchor all dates to Asia/Karachi (the project is Pakistan-only). generateSlots, the appointments POST, and the availability GET all use them, replacing string/local parsing.
•	src/app/api/appointments/route.ts — validates date format, validates the requested timeSlot is actually a generated slot for that date, runs a pre-check for booked slots, and maps SlotAlreadyBookedError → 409.
Functional
•	Availability validation: src/app/api/availability/route.ts rejects HH:mm format errors, endTime ≤ startTime, and ranges shorter than the chosen slot duration. Clear "End time must be later than start time" error.
•	Multiple blocks per day: setAvailability no longer upserts on doctor+clinic+day — it always inserts. New findOverlappingAvailability blocks only true time overlaps, so e.g. 3-5pm and 7-10pm on Monday are both accepted.
•	Recurring is now opt-in: AvailabilityDoc.repeatWeekly (default false in the UI) + specificDate. The Add Availability form has a "Repeat weekly" checkbox; when off it shows a date picker for a one-off slot. generateSlots matches one-offs by exact date, recurring by weekday. Existing legacy docs (no field) default to recurring so they keep working.
•	Doctor profile picture: optional photoUrl on UserProfileDoc, editable in src/app/(app)/o/doctor/profile/page.tsx with a live preview, allowed through PUT /api/users/me, rendered on src/components/doctor/DoctorCard.tsx.
•	Clinic location: latitude, longitude, mapUrl on ClinicDoc (all optional, range-validated in src/app/api/clinics/route.ts). Doctor profile clinic form has lat/lng/Maps-link inputs; existing clinic cards show a "View on Google Maps" link when set.
npx tsc --noEmit is clean.

UPDATE: 										 4/9/2026
Summary of what changed:
New shared modules
•	src/lib/fees.ts — computeFees, computeRefund, formatPKR. Platform fee = 2% of consultation, tax = 5%, refund = total − 2% platform fee.
•	src/lib/policy.ts — canDoctorModify (≥1h before), canPatientModify (≥24h before; same-day exception within 1h of booking AND ≥1h before slot), plus PATIENT_POLICY_SUMMARY shown to patients during booking.
Types
•	src/types/index.ts — removed latitude/longitude from ClinicDoc. Added AppointmentPayment, PaymentStatus, and completion/rating/cancel/reschedule fields on Appointment.
1. Doctor profile picture (UI + validation only)
•	src/app/(app)/o/doctor/profile/page.tsx — Replaced URL input with Attach Profile Picture file picker (accept="image/*"). Validates MIME type (jpg/png/jpeg/webp/gif) and shows the three required messages: "Profile picture updated" / "Invalid file type" / "Unable to store image". The file is read as a data URL for preview only — no real upload. The simulation banner stays until you click OK.
2. Clinic location
•	Removed latitude/longitude fields from the form, types, and the POST /api/clinics & PUT /api/clinics validators (src/app/api/clinics/route.ts).
•	Added Attach Location button that simulates opening Google Maps, generates a random Karachi-area Maps URL, and stores it in mapUrl. A banner explains what would happen (search/current/manual select) and stays until acknowledged.
3. Booking + payment (simulated escrow)
•	src/app/(public)/book/[clinicSlug]/page.tsx — "Request Booking" button is now Continue to Payment. It opens a PaymentReviewModal showing consultation fee + 2% platform fee + 5% tax + total, plus an escrow explanation banner. Pay simulates a 1.2 s payment, then POSTs to the API with paymentConfirmed: true.
•	src/app/api/appointments/route.ts — POST now requires paymentConfirmed (returns 402 otherwise), computes the fee breakdown server-side from the doctor's stored fee, attaches a payment object with status: "held", and creates the appointment with status confirmed (no longer pending) — so it shows immediately on the patient/doctor/receptionist dashboards.
4 + 5. Cancel & Reschedule
•	New PATCH /api/appointments with actions cancel, reschedule, doctor-confirm-complete, patient-confirm-complete, rate. All actions check ownership (patient vs doctor) and apply the policy from lib/policy.ts.
•	Reschedule validates the new slot belongs to the doctor's availability and isn't taken, then atomically moves the doc via rescheduleAppointment (transaction over deterministic IDs). Tracks rescheduleHistory with from-date/from-slot/by/reason/at.
•	Cancel computes refund = total − 2% and writes payment.status = "refunded" with refundAmount and refundedAt.
•	New shared component src/components/appointments/AppointmentActions.tsx provides the Cancel / Reschedule / Mark-Visit-Completed / Rate / Receipt buttons. Buttons are disabled with a tooltip when policy says no, and the policy reason is also printed below the row. The reschedule modal fetches available slots from /api/availability?doctorId=&date= so the patient can only pick truly free slots, and requires a reason.
•	Wired into src/app/(app)/o/patient/appointments/page.tsx and src/app/(app)/o/doctor/appointments/page.tsx.
6. Completion flow
•	Both Mark Visit Completed (doctor) and Confirm Visit Completed (patient) call PATCH actions that flip a *ConfirmedCompleted flag. When both are true, the appointment flips to completed, payment.status becomes released with a releasedAt stamp (doctor payout, simulated), and patient sees a Rate button.
•	Rate modal collects 1–5 stars for doctor + platform + optional feedback, persisted on the appointment.
•	Receipt modal renders the full breakdown + payout status whenever the appointment is completed.
All simulated steps (photo upload, map picker, payment, refund, payout) display an explanatory banner that the user must dismiss with an OK button before it disappears, per your request.
Error Resolved:
The fix: the dark overlay was Next.js's dev-mode runtime-error overlay, triggered by AppointmentActions crashing on render. Root cause: canPatientModify called Intl.DateTimeFormat.formatToParts(new Date(undefined)) for legacy appointments missing createdAt, which throws RangeError: Invalid time value. Once the page errored on every load, the dark transparent error overlay stuck around even after restarting the dev server, because the error came back on every mount.
Changes:
•	src/lib/policy.ts — canPatientModify now falls back to "now" when bookedAtISO is missing/invalid; todayInAppTz and appointmentStart guard against Invalid Date inputs.
•	src/components/appointments/AppointmentActions.tsx — wrapped the policy useMemo in a try/catch as belt-and-braces so any future bad data shows a disabled-with-reason instead of crashing the whole list.
Reload the page — the overlay should be gone, and your existing appointments should render with the cancel/reschedule buttons (legacy ones without payment will just show no payout/receipt info, which is correct).

UPDATE: 										          4/9/2026
All three features wired in. Type-check clean.
1. Pending → auto-cancel after 1h (+ one-shot cleanup)
•	src/lib/firebase/firestore.ts — runAppointmentMaintenance() cancels any pending appointment whose createdAt is ≥ 1h old, and cancelAllPendingAppointments() is the one-shot helper that nukes every existing pending one regardless of age.
•	src/app/api/appointments/route.ts — GET /api/appointments now runs ensurePendingCleanup() (one-shot, server-process-scoped) followed by runAppointmentMaintenance() on every list call. Both are idempotent and bounded by in-flight count, so they're safe as a poor-man's cron until you wire a real scheduler.
2. Completion timing
•	src/lib/policy.ts — added appointmentEnd(date, slot, slotDurationMinutes) and DEFAULT_SLOT_DURATION_MINUTES = 30.
•	POST /api/appointments now resolves and stores slotDuration from the doctor's availability block so end-time is computable later (legacy rows fall back to 30 min).
•	AppointmentActions.tsx — "Mark/Confirm Visit Completed" buttons only render after Date.now() >= appointmentEnd(...). Until then a small italic line tells the user when it'll appear.
•	Server enforces the same gate: ensurePastSlotEnd() returns 400 if either party hits the action too early.
•	Auto-completion in runAppointmentMaintenance():
o	Neither party confirmed → after 24h past slot end → mark completed, autoConfirmedBy: "both".
o	One party confirmed → after 12h since their *ConfirmedAt → auto-confirm the other → completed, autoConfirmedBy: "doctor"|"patient".
o	In both cases the held escrow is released and a notification fans out.
•	Reschedule clears prior *ConfirmedCompleted / *ConfirmedAt flags (and stores new slotDuration) so the timer restarts cleanly for the new slot.
3. Notifications
•	New NotificationDoc type + notifications Firestore collection.
•	Helpers: addNotification, notifyMany, listNotificationsByUser, markNotificationsRead.
•	Emitted on every state change, fanned out to both patient and doctor:
o	booked — POST /api/appointments
o	cancelled — patient or doctor cancel via PATCH
o	rescheduled — patient or doctor reschedule via PATCH
o	completed — when both sides confirmed (manual)
o	auto-confirmed — when the maintenance pass auto-completes
o	auto-cancelled — when the maintenance pass cancels a stale pending one (and the one-shot cleanup)
•	New API: GET /api/notifications lists, PATCH /api/notifications marks read (all or by id).
•	New UI: NotificationBell — bell icon with unread badge, dropdown panel with icon-coded entries, "Mark all read", auto-refresh every 30 s, outside-click to close.
•	Wired into DashboardLayout.tsx — visible in both the mobile top bar and the desktop sidebar's bottom section, so every dashboard (patient, doctor, reception, admin) gets it for free.
Note on the one-shot pending cleanup: it runs once per server process (resets on dev restart). After your first dashboard load, every existing pending appointment will be cancelled and both parties will receive an auto-cancelled notification.

UPDATE:										4/9/2026
Type-check is clean. Done — summary of all 6 fixes:
1.	Notification panel (NotificationBell.tsx) — switched to fixed inset-x-2 top-16 on mobile / lg:absolute lg:left-0 on desktop with max-w-sm and break-words, so the panel always stays inside the viewport and long messages wrap.
2.	Appointment sorting & overview filtering
o	Both patient appointments and doctor appointments now sort with confirmed → pending → in-progress → completed → cancelled (then by date desc).
o	Patient overview and doctor overview hide cancelled rows.
3.	Doctor profile picture lightbox (c/[clinicSlug]/page.tsx) — header now shows the doctor's photoUrl (or a fallback avatar). Clicking opens a full-screen lightbox with click-outside / × to close.
4.	Doctor reschedule UX (AppointmentActions.tsx + policy.ts + route.ts)
o	New helper generateDoctorRescheduleSlots() produces every 30-min label from 8:00 AM to 11:00 PM.
o	Server relaxes the availability check for by === "doctor", only enforcing the 8 AM – 11 PM window via isWithinDoctorWindow.
o	Server now also rejects new slots whose start is in the past.
o	Date input has min={todayInAppTz()} to disable past dates.
o	Reschedule modal for doctors shows: a "Your appointments on YYYY-MM-DD" panel pulled from /api/appointments (so the doctor sees all booked slots before picking), plus the 8–23 grid where booked or past slots are disabled (grey + line-through).
5.	Patient reschedule confirm/cancel + auto-confirm (types, route, firestore, UI)
o	New Appointment.pendingPatientConfirmation + rescheduleProposedAt fields.
o	When the doctor reschedules, the appointment is flagged pending and the patient gets a clear notification ("Doctor rescheduled — action needed").
o	Patient sees a banner with Confirm / Cancel & refund buttons. New PATCH actions: patient-confirm-reschedule and patient-reject-reschedule (which cancels with the standard refund-minus-2% policy, bypassing the ≥1-day rule because it's a forced response).
o	runAppointmentMaintenance() auto-confirms pending reschedules after 6 hours OR ≤ 1 hour before appointment start, whichever comes first, and notifies both parties.
6.	Doctor communication reminder (AppointmentActions + route notifications)
o	After a successful doctor reschedule, the doctor sees an amber Contact the patient banner with phone-call icon, OK button, and an explanation of the auto-confirm fallback.
o	The doctor's own notification on reschedule now reads "Please contact the patient (call/SMS) to confirm."
o	The patient's notification clearly says the doctor rescheduled and they must confirm or cancel.
All timezone math goes through the existing Asia/Karachi-based helpers (appointmentStart, appointmentEnd, todayInAppTz). Type-check passes clean.

UPDATE:										       4/10/2026
1. Patient cancel/reschedule policy — src/lib/policy.ts:93-129 Replaced the old "≥24h OR same-day 1h window" rules with the two-condition AND rule: must be within 1 hour of booking and at least 1 hour before the appointment. Still timezone-safe via appointmentStart (Asia/Karachi UTC+5). Updated PATIENT_POLICY_SUMMARY.
2. Mandatory CNIC for doctors
•	src/types/index.ts — added cnic?: string to UserProfileDoc.
•	src/lib/utils.ts — normalizeCnic, isValidCnic (13 digits), formatCnic (XXXXX-XXXXXXX-X).
•	src/app/api/users/route.ts — rejects doctor signup without a valid CNIC; stores normalized digits.
•	src/app/api/users/me/route.ts — validates CNIC on profile updates.
•	src/app/(auth)/register/page.tsx — doctor registration now requires CNIC (phone + email flows), with formatting hint and inputMode="numeric".
•	src/app/(auth)/auth/login/page.tsx — forwards CNIC from pending sessionStorage to the profile-create call.
•	src/app/(app)/o/doctor/profile/page.tsx — adds required CNIC field with inline validation; save is blocked until valid.
3. Clinic location input — src/app/(app)/o/doctor/profile/page.tsx:611-672 Two clearly-labeled options: Option 1 — paste URL (text input) and Option 2 — Attach Location (button). Both write to the single mapUrl field, so using one overwrites the other — no duplicate storage. The helper text explicitly states both options do the same thing, and each interaction shows a message explaining the overwrite.
4. Role-aware notifications
•	src/app/api/appointments/route.ts — added withDoctorTitle and notifyAppointmentParties(appt, { message: (counterparty) => … }). Patients see Dr. <name>; doctors see <patient name>. Applied to book, cancel, complete (both paths), reschedule, patient-confirm-reschedule, reject-reschedule.
•	src/lib/firebase/firestore.ts — same helper added for maintenance jobs (auto-cancel pending, auto-confirm reschedule, auto-complete, cancel-all-pending). Doctors no longer receive patient-phrased notifications.
Type check (tsc --noEmit) passes clean.
All tasks done. Summary of changes:
Patient profile fields (src/types/index.ts, src/app/api/users/me/route.ts, src/app/(app)/o/patient/profile/page.tsx)
•	Added age, dob, gender to UserProfileDoc with validation in the PUT /api/users/me handler (DOB must be valid + not future; age 0-120 integer; gender enum).
•	Profile page now has DOB/age/gender inputs; age auto-derives from DOB.
Booking card auto-fill (src/app/(public)/book/[clinicSlug]/page.tsx, src/app/api/appointments/route.ts)
•	Booking page pre-fills name, phone, and age from patient profile (age derives from DOB if needed).
•	Appointment now carries patientPhone and patientAge snapshotted server-side from the canonical profile.
•	Doctor dashboard (src/app/(app)/o/doctor/page.tsx) shows the patient's phone + age on each appointment card.
Doctor rating system (src/lib/firebase/firestore.ts)
•	New reviews collection with deterministic doc ID ${doctorId}_${patientId} so each patient can have exactly one review per doctor.
•	upsertReview runs in a Firestore transaction that simultaneously updates the review doc and the doctor's ratingSum / ratingCount / ratingAverage aggregate — avoids recomputation.
•	hasCompletedAppointmentBetween gates who can review.
Reviews API (src/app/api/reviews/route.ts)
•	GET /api/reviews?doctorId=... returns reviews + aggregate (supports &mine=1 for the current patient's review).
•	POST /api/reviews upserts (requires patient role + at least one completed appointment with the doctor).
Rate flow (src/app/api/appointments/route.ts, src/components/appointments/AppointmentActions.tsx)
•	The existing rate action now also upsertReviews through the same transactional path, so the canonical review and doctor aggregate always stay in sync.
•	Patient can open the rate modal again on a completed appointment — the button becomes Edit Rating and is pre-filled with the existing review; the upsert overwrites the previous review.
Average-rating display
•	New reusable src/components/doctor/RatingStars.tsx supporting fractional stars.
•	DoctorCard shows average stars + count (fallback "New" when none).
•	Doctor detail page shows the average in the About card and a new Comments section listing each review with a Verified Patient badge.
•	Doctor dashboard has a new "Average rating" card driven by the aggregate.

UPDATE:										       4/11/2026

Summary
1. Rating UI Bug — src/components/doctor/RatingStars.tsx Rewrote to explicitly render exactly 5 stars (filled / half / empty) based on the rounded value, instead of relying on an absolute-positioned clip overlay that could desync layout-wise.
2. Comments Privacy — src/app/api/reviews/route.ts + src/app/(public)/c/[clinicSlug]/page.tsx Server now strips patientName from the public reviews response. The card only shows the "Verified Patient" badge + rating.
3. Rating Consistency (Critical) — src/lib/firebase/firestore.ts, src/app/api/appointments/route.ts, src/app/api/reviews/route.ts
•	The canonical review doc was already keyed ${doctorId}_${patientId} (one per pair).
•	Added propagateRatingToCompletedAppointments() — a batched update that rewrites every completed appointment between that patient/doctor with the latest rating + feedback.
•	Called from both handleRate (appointments action) and the /api/reviews POST endpoint, so editing from either place overrides previous ratings everywhere. Removed the stale per-visit doctorRating write in handleRate — it's now always propagated.
4. Doctor Details Auth/Routing — src/components/layout/PublicNavbar.tsx + src/app/(public)/c/[clinicSlug]/page.tsx
•	PublicNavbar now calls /api/users/me and shows a "My Dashboard" button (role-aware path) when logged in instead of "Login / Get Started".
•	Details page added a role-aware "Back to Dashboard" / "Back to Search" breadcrumb at the top.
5. Booking Card Phone — src/app/(public)/book/[clinicSlug]/page.tsx Phone fetch hardened (cache: "no-store"), label now shows "(from your profile)" when auto-filled, and a hint nudges patients with an empty profile phone to set it.
6. Patient Profile Picture + Email — src/app/(app)/o/patient/profile/page.tsx + src/app/api/users/me/route.ts Full "Attach Profile Picture" flow mirroring the doctor profile (file picker, MIME validation, simulated upload via FileReader, preview, remove). Added optional editable email field with regex validation on PUT, plus made phone editable so patients can fix missing numbers.
7. My Doctors Section — src/app/(app)/o/patient/page.tsx New card on the patient dashboard that groups completed appointments by doctor and shows name, specialty (fetched from /api/doctors/[id]), visit count, current rating (from the propagated doctorRating), and View/Edit Rating buttons. Because of fix #3, the rating shown here matches the one on the doctor page and on every individual appointment.

UPDATE:										       4/11/2026
Full receptionist role system is implemented and typechecks cleanly. Summary of what's now in place:
Phase 1 — Types & data layer (src/types/index.ts, src/lib/firebase/firestore.ts)
•	ReceptionistPermissions, DoctorInviteState, multi-doctor fields on UserProfileDoc, checkInStatus/actionBy/actionHistory on Appointment, 4 new NotificationTypes.
•	Helpers: findUserByEmail, linkExistingReceptionist, setReceptionistInviteStatus, activateReceptionist, updateReceptionistPermissions/Clinics, unlinkReceptionistFromDoctor, receptionistCan, listAppointmentsForReceptionist, updateAppointmentWithAudit, auto-running legacy migration.
Phase 2 — APIs & doctor UI
•	src/app/api/receptionists/route.ts: GET (list + email lookup), POST (create OR link mode), PUT (permissions/clinics), DELETE (unlink). Response is scoped to the current doctor's map entries.
•	src/app/api/receptionists/me/invites/route.ts: receptionists accept/reject per doctor.
•	src/app/(app)/o/doctor/profile/page.tsx: Create New / Link Existing tabs, email search, credentials popup, per-receptionist permission toggles, unlink.
Phase 3 — Forced password reset (src/app/(auth)/auth/reset-password/page.tsx, src/app/api/auth/reset-password/route.ts)
•	src/app/(app)/app/page.tsx:48 and src/app/(app)/o/reception/layout.tsx redirect receptionists with mustResetPassword to the reset page. API endpoint clears the flag and flips accepted → active via activateReceptionist.
Phase 4 — Reception dashboard (overview, appointments, queue, profile under src/app/(app)/o/reception/)
•	Overview shows pending invites (accept/reject), today's stats, and a check-in queue (waiting → arrived → in-progress → done → complete).
•	Appointments page lists all linked-doctor appointments with search + doctor filter + cancel.
•	Profile shows per-doctor permission grid (read-only on the receptionist side).
Phase 5 — Appointments API (src/app/api/appointments/route.ts)
•	GET now routes reception → listAppointmentsForReceptionist.
•	PATCH accepts reception role, gates every action against receptionistCan(doctor, permission), adds mark-arrived/mark-in-progress/mark-done and a reception-only mark-complete shortcut, sends patient-arrived notifications.
•	handleCancel and handleReschedule now write audit entries (actionBy + actionHistory) via updateAppointmentWithAudit.
npx tsc --noEmit exits clean.
