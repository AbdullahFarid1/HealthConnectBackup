# PR Title
Platform Update: Receptionist Role System, Rating & Review Overhaul, Audit Trail, and Booking UX Polish

# PR Description

## Summary
This PR builds on the Phase 1 backend integration and delivers the next major slice of HealthConnect. It ships a complete **multi-doctor receptionist role** (invites, per-doctor permissions, forced password reset, check-in queue), a **patient review + rating overhaul** (privacy-preserving comments, consistent per-patient ratings, aggregate stats), an **appointment audit trail**, and a batch of patient/doctor **UX fixes** around profiles, booking, and navigation.

Everything is backend-backed by Firestore, typechecks clean (`npx tsc --noEmit` → 0 errors), and includes a one-shot legacy-schema migration for existing receptionist documents.

---

## 1. Receptionist Role System (new)

A full, production-shaped multi-tenant receptionist role. A single receptionist account can now be linked to multiple doctors, each with independent permissions and invite state.

### Data model ([src/types/index.ts](src/types/index.ts))
- `ReceptionistPermissions` — granular toggles: `cancel`, `reschedule`, `viewPatientDetails`, `manageQueue`, `markCompletion`.
- `DoctorInviteState` — per-doctor lifecycle: `invited → accepted → active`, plus `rejected` / `expired` (48h TTL).
- `UserProfileDoc` gains `invitedByDoctorIds[]`, `doctorInviteStatuses`, `doctorPermissions`, `mustResetPassword`.
- `Appointment` gains `checkInStatus` (`waiting | arrived | in-progress | done`), `checkInUpdatedAt`, plus `actionBy` / `actionHistory` for audit.
- New `NotificationType`s: `invite-received`, `invite-accepted`, `invite-rejected`, `patient-arrived`.

### Firestore helpers ([src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts))
- `findUserByEmail` — cross-collection lookup with case-insensitive fallback.
- `createReceptionistInvite` — creates a Firebase Auth user + profile, returns a one-time temp password.
- `linkExistingReceptionist` — links an existing reception account to a new doctor; **blocks multi-role users** (no doctor↔patient↔reception crossover).
- `setReceptionistInviteStatus` / `activateReceptionist` — state machine with transition guards.
- `updateReceptionistPermissions` / `updateReceptionistClinics` / `unlinkReceptionistFromDoctor`.
- `receptionistCan(uid, doctorId, permission)` — gate helper used by the appointments API.
- `listAppointmentsForReceptionist` — aggregates across every actively linked doctor, deduped and sorted.
- `runReceptionistMigration` / `ensureReceptionistMigration` — **one-shot-per-boot** migration of legacy singular schema (`invitedByDoctorId`, `assignedClinicIds`, `inviteStatus`) → the new multi-doctor shape. Idempotent.
- Lazy expiry: `listReceptionistsByDoctor` auto-materializes expired invites on read.

### API endpoints
- [`/api/receptionists`](src/app/api/receptionists/route.ts)
  - `GET` — list (doctor-scoped; only current doctor's permissions/invite entries are returned).
  - `GET ?email=` — lookup for the "Link existing" flow with a `canLink` / `alreadyLinked` / reason contract.
  - `POST { mode: "create" | "link" }` — unified create-or-link.
  - `PUT { uid, permissions?, clinicIds? }` — verifies the receptionist is actually linked to the caller before mutating.
  - `DELETE` — **unlink** (account preserved so the receptionist can keep working for other doctors).
- [`/api/receptionists/me/invites`](src/app/api/receptionists/me/invites/route.ts) — receptionist lists and accepts/rejects per-doctor invites. Fans out doctor-side notifications.
- [`/api/auth/reset-password`](src/app/api/auth/reset-password/route.ts) — finalizes the forced reset: clears `mustResetPassword` and flips every `accepted` invite → `active`.

### Forced password reset flow
- [src/app/(auth)/auth/reset-password/page.tsx](src/app/(auth)/auth/reset-password/page.tsx) — dedicated page with client-side validation and `auth/requires-recent-login` handling.
- [src/app/(app)/app/page.tsx](src/app/(app)/app/page.tsx) and [src/app/(app)/o/reception/layout.tsx](src/app/(app)/o/reception/layout.tsx) — redirect any receptionist with `mustResetPassword: true` to the reset page before they can reach a dashboard.

### Doctor-side UI ([src/app/(app)/o/doctor/profile/page.tsx](src/app/(app)/o/doctor/profile/page.tsx))
- Tabbed **Create New** / **Link Existing** form, with live email search, credentials popup (email + temp password), and inline error feedback.
- Per-receptionist permission toggles on existing linked cards (optimistic updates, server-side enforced).
- Initial permission presets when sending a new invite.
- Unlink flow with confirmation (preserves the account).

### Reception dashboard ([src/app/(app)/o/reception/](src/app/(app)/o/reception/))
- **Overview** — pending invite banner with Accept/Reject, live stats (queue/checked-in/completed), linked-doctor chips, today's queue with one-click `Arrived → Start → Done → Complete`.
- **Appointments** — cross-doctor list with search + doctor filter + cancel (permission-gated).
- **Queue** — points at overview (queue is derived, not a separate collection).
- **Profile** — read-only per-doctor permission grid + editable name/phone.

### Appointments API ([src/app/api/appointments/route.ts](src/app/api/appointments/route.ts))
- Reception role added to `GET` (uses `listAppointmentsForReceptionist`).
- `PATCH` now accepts reception and **gates every action on `receptionistCan()`** against the appointment's doctor + the specific permission.
- New actions: `mark-arrived`, `mark-in-progress`, `mark-done`, plus a reception-only `mark-complete` shortcut that dual-confirms and releases escrow.
- `mark-arrived` sends a `patient-arrived` notification to the doctor.
- `handleCancel` / `handleReschedule` now write an **audit entry** (`actionBy` + append-only `actionHistory`) via the new `updateAppointmentWithAudit` helper.

---

## 2. Ratings & Reviews Overhaul

### Problems fixed
- The star component miscounted fractional ratings (wrong number of stars rendered).
- Public reviews leaked patient names.
- Rating a doctor produced per-visit inconsistency — the same patient could show different scores on different completed visits.

### Changes
- [src/components/doctor/RatingStars.tsx](src/components/doctor/RatingStars.tsx) — rewritten to always render exactly 5 stars using explicit full / half / empty icons.
- [src/app/api/reviews/route.ts](src/app/api/reviews/route.ts) — strips `patientName` from public responses; reviews now display as **"Verified Patient"**. Review upserts propagate the latest rating to every completed appointment.
- `propagateRatingToCompletedAppointments` ([firestore.ts](src/lib/firebase/firestore.ts)) — batched update so every past visit between the same (patient, doctor) pair reflects the current rating.
- Doctor profile aggregates (`ratingAverage`, `ratingCount`, `ratingSum`) are maintained transactionally on review create/update so doctor cards and dashboards can read them in one hop.
- [src/app/(public)/c/[clinicSlug]/page.tsx](src/app/(public)/c/[clinicSlug]/page.tsx) — removed patient names from the public reviews section and added a "Back to Dashboard / Search" breadcrumb that detects viewer auth state.

---

## 3. Patient & Doctor UX Fixes

- **Navbar auth detection** ([src/components/layout/PublicNavbar.tsx](src/components/layout/PublicNavbar.tsx)) — public navbar no longer shows `Login` / `Get Started` to authenticated users; it now shows a role-aware `Go to Dashboard` button.
- **Booking phone autofill** ([src/app/(public)/book/[clinicSlug]/page.tsx](src/app/(public)/book/[clinicSlug]/page.tsx)) — phone number is pre-filled from the patient profile with a "(from your profile)" label, still editable.
- **Patient profile** ([src/app/(app)/o/patient/profile/page.tsx](src/app/(app)/o/patient/profile/page.tsx)) — profile picture upload (client-side data URL, simulated until Firebase Storage is wired), editable email with validation, editable phone, DOB↔age sync.
- **Email validation** ([src/app/api/users/me/route.ts](src/app/api/users/me/route.ts)) — `PUT /api/users/me` now validates email format and normalizes the value.
- **Patient dashboard "My Doctors"** ([src/app/(app)/o/patient/page.tsx](src/app/(app)/o/patient/page.tsx)) — new section grouping completed visits by doctor, showing visit count and the patient's current rating, with specialty lookups cached per doctor.

---

## 4. Notifications

- `NotificationBell` ([src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx)) — icon + color mappings for the four new receptionist/queue events so receptionists and doctors see them in the existing bell dropdown with no extra plumbing.
- All invite and check-in events are emitted through the existing `addNotification` / `notifyMany` fan-out helpers — no new transport.

---

## 5. Why This Matters

- **Unblocks real clinic operations.** Doctors can delegate scheduling, check-ins, and completion to receptionists without compromising authorization — every mutation is gated by an explicit per-doctor permission and recorded in an audit trail.
- **Multi-doctor receptionists are first-class.** One person can staff multiple practices; each doctor controls their own permissions independently, and removing one link never touches the others.
- **Privacy and consistency on reviews.** No more leaked patient names, no more inconsistent rating displays across a patient's completed visits, and doctor cards can render aggregate stats without N additional reads.
- **Audit trail is production-safe.** Cancel/reschedule/check-in/complete all write to an append-only `actionHistory`, so doctors can see exactly who did what.

---

## 6. Breaking / Behavior Changes

- **Receptionist schema migration.** Legacy receptionist docs using `invitedByDoctorId` / `assignedClinicIds` / `inviteStatus` are auto-upgraded to the new `invitedByDoctorIds[]` / `doctorInviteStatuses` / `doctorPermissions` shape on first server boot. The migration is idempotent and runs once per process.
- **No multi-role users.** Linking an existing account now hard-fails if the target user's role is not `reception`. This is intentional and enforced in `linkExistingReceptionist`.
- **`DELETE /api/receptionists` is now an unlink**, not an account delete. The Firebase Auth user and profile are preserved.
- **`PATCH /api/appointments` adds new actions** (`mark-arrived`, `mark-in-progress`, `mark-done`, `mark-complete`) and a new authorization branch for `reception`. Existing doctor/patient actions are unchanged.
- **Reviews no longer return `patientName` to the public.** Any client relying on that field must switch to the "Verified Patient" label.

---

## 7. Firebase / Infra Follow-ups

Recommended composite indexes (the new queries will prompt you in the console if missing):

- `receptionists`: `role ASC, invitedByDoctorIds array-contains` — used by `listReceptionistsByDoctor`.
- `appointments`: `doctorId ASC, date ASC` — used by the reception dashboard's today-queue.
- `reviews`: `doctorId ASC, updatedAt DESC` — used by the public doctor page.

Already present from Phase 1 (still required):
- `appointments`: `patientId ASC, date DESC`
- `appointments`: `doctorId ASC, date DESC`
- `clinics`: `doctorId ASC, createdAt ASC`
- `availability`: `clinicId ASC, dayOfWeek ASC`
- `availability`: `doctorId ASC, dayOfWeek ASC`

---

## 8. Testing Notes

- `npx tsc --noEmit` — **0 errors.**
- Manual end-to-end validation performed across:
  - Create-new and link-existing receptionist flows (including role-mismatch rejection and the 48h expiry path).
  - Forced password reset gate → activation → dashboard access.
  - Permission toggles flipping live behavior in the appointments API (e.g. disabling `cancel` returns 403).
  - Reception overview check-in state machine (`waiting → arrived → in-progress → done → complete`).
  - Rating propagation across a patient's completed visits for the same doctor.
  - Public doctor page reviews rendering without patient names and with the correct aggregated star count.
  - Navbar auth detection for logged-in vs logged-out viewers.
- No automated test suite is included in this PR.

---

## 9. File Highlights

- **Types & data layer** — [src/types/index.ts](src/types/index.ts), [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts)
- **Receptionist APIs** — [src/app/api/receptionists/route.ts](src/app/api/receptionists/route.ts), [src/app/api/receptionists/me/invites/route.ts](src/app/api/receptionists/me/invites/route.ts), [src/app/api/auth/reset-password/route.ts](src/app/api/auth/reset-password/route.ts)
- **Doctor profile UI** — [src/app/(app)/o/doctor/profile/page.tsx](src/app/(app)/o/doctor/profile/page.tsx)
- **Reception dashboard** — [src/app/(app)/o/reception/page.tsx](src/app/(app)/o/reception/page.tsx), [src/app/(app)/o/reception/appointments/page.tsx](src/app/(app)/o/reception/appointments/page.tsx), [src/app/(app)/o/reception/profile/page.tsx](src/app/(app)/o/reception/profile/page.tsx), [src/app/(app)/o/reception/layout.tsx](src/app/(app)/o/reception/layout.tsx)
- **Forced reset flow** — [src/app/(auth)/auth/reset-password/page.tsx](src/app/(auth)/auth/reset-password/page.tsx), [src/app/(app)/app/page.tsx](src/app/(app)/app/page.tsx)
- **Appointments API** — [src/app/api/appointments/route.ts](src/app/api/appointments/route.ts)
- **Reviews & ratings** — [src/app/api/reviews/route.ts](src/app/api/reviews/route.ts), [src/components/doctor/RatingStars.tsx](src/components/doctor/RatingStars.tsx), [src/app/(public)/c/[clinicSlug]/page.tsx](src/app/(public)/c/[clinicSlug]/page.tsx)
- **Patient UX** — [src/app/(app)/o/patient/page.tsx](src/app/(app)/o/patient/page.tsx), [src/app/(app)/o/patient/profile/page.tsx](src/app/(app)/o/patient/profile/page.tsx), [src/app/(public)/book/[clinicSlug]/page.tsx](src/app/(public)/book/[clinicSlug]/page.tsx)
- **Notifications** — [src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx)
