# PR Title
Phase 1 Backend Integration: Firestore APIs, Role-Based Profiles, Doctor Refactor, and Real Data Flows

# PR Description
## Summary
This PR moves HealthConnect from a mostly static MVP shell to a working backend-connected platform for core flows.
It introduces Firestore-backed APIs, role-based profile storage, real booking/search/profile data flows, route protection, and a doctor terminology refactor (dentist -> doctor) with backward compatibility for legacy values.

## What’s Included

1. Firestore data layer
- Added centralized Firestore service for CRUD operations across users/profiles, doctors, appointments, clinics, availability, and receptionists.
- Added write sanitization to strip undefined values before persistence to avoid runtime write errors.

2. API routes (core backend)
- Users:
  - Create profile + claims setup
  - Read/update current user profile
- Doctors:
  - Search with filters
  - Doctor detail endpoint returning doctor + clinics + availability
- Appointments:
  - Create booking (clinic-aware)
  - List appointments
- Clinics:
  - Create/list/update/delete clinic records
- Availability:
  - Create/update/delete slot configs
  - Generate available slots for selected date minus already-booked slots
- Receptionists:
  - Invite/list/update/remove receptionist users

3. Authentication + profile wiring
- Registration/login flows now persist profile data after auth.
- Receptionist invitation flow improved with visible error feedback and clearer credential handoff UX.

4. Role-based data model hardening
- Migrated from single shared `users` collection to role-specific collections (`patients`, `doctors`, `receptionists`, `admins`) to prevent overwrite collisions.
- Profile fetch supports fallback/migration behavior for legacy entries.

5. Frontend integration with real data
- Patient pages now use real API-driven data:
  - Overview, appointments, profile, and booking
- Doctor pages now use real API-driven data:
  - Overview, appointments, patients, profile
- Search and booking pages connected to real doctor/availability data.

6. Booking and discovery UX improvements
- Replaced hardcoded booking slots with dynamic slot fetching.
- Added clinic selection flow for multi-clinic doctors.
- Enforced `clinicId` in appointment booking payload.
- Wired reusable doctor card component across search/booking screens.
- Doctor detail page now renders real doctor + clinic + schedule data.

7. Route protection
- Added middleware guard redirecting unauthenticated access from protected app routes to login.

8. Domain terminology refactor
- Refactored route/model/navigation terminology from `dentist` to `doctor`.
- Added compatibility handling for legacy `dentist` role values during transition.

## Why This Matters
- Converts core user journeys from demo/static to backend-backed:
  - doctor discovery
  - booking
  - appointment listing
  - profile management
- Removes a critical profile-overwrite risk with role-isolated storage.
- Establishes the API/service foundation needed for Phase 2+ features (verification, realtime ops, monetization).

## Breaking/Behavior Changes
- Doctor-related routes and model fields now use `doctor` naming.
- Legacy values remain accepted in key paths for backward compatibility.
- Appointment booking now requires valid clinic context.

## Firebase/Infra Follow-ups Required
Create Firestore composite indexes (auto-prompts will appear, but recommended to pre-create):
- appointments: patientId ASC, date DESC
- appointments: doctorId ASC, date DESC
- clinics: doctorId ASC, createdAt ASC
- availability: clinicId ASC, dayOfWeek ASC
- availability: doctorId ASC, dayOfWeek ASC
- users/role-based listing path: role ASC, invitedByDoctorId ASC

## Testing Notes
- Manual validation performed through end-to-end UI flows for auth, doctor search, booking, profile updates, dashboard data rendering, clinic/availability/receptionist management.
- No automated test suite is included yet in this PR.
