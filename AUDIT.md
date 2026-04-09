# HealthConnect Security Audit

Date: 2026-04-09 (refresh)
Scope: API authorization, auth/session handling, scheduling integrity, dependency vulnerabilities

## Executive Summary

- Previous report had several high-risk issues.
- Some critical security items are now fixed.
- Multiple cross-tenant authorization gaps still remain and are the top priority.
- Dependency scan still reports 9 advisories total: 1 moderate, 8 low.

## Status Change Since Previous Report

### Fixed Since Previous Audit

1. Logout token revocation is now implemented.
- Evidence: `src/app/api/auth/logout/route.ts` calls `verifySessionCookie` and `revokeRefreshTokens`.
- Lines: 12, 13

2. Booking race/double-booking has transaction-safe protection.
- Evidence: `src/lib/firebase/firestore.ts` uses deterministic appointment IDs + `runTransaction` + `SlotAlreadyBookedError` guards.
- Lines: 395, 408, 483

3. Date/timezone handling was hardened.
- Evidence: app timezone helpers are present and used (`todayInAppTz`, `dayOfWeekForDate`, `isValidDateString`).
- Lines: 58, 70, 82 in `src/lib/firebase/firestore.ts`

### Still Open (Previously Reported)

1. Role escalation during profile creation remains open.
- `POST /api/users` still takes role from request body and accepts admin/reception values.
- Evidence: `src/app/api/users/route.ts` lines 29, 32, 33

2. Clinic ownership checks for update/delete remain open.
- Evidence: `src/app/api/clinics/route.ts` lines 60, 72, 76, 94

3. Receptionist tenant ownership checks for update/delete remain open.
- Evidence: `src/app/api/receptionists/route.ts` lines 68, 80, 84, 91

4. Availability ownership protections remain open.
- Evidence: `src/app/api/availability/route.ts` lines 78, 79, 86, 222, 229

5. Middleware is still presence-only (cookie exists), not role-validated.
- Evidence: `src/middleware.ts` lines 14, 19, 28

## New/Refined Findings (Current Code)

### Critical

1. IDOR/BOLA: clinic mutation endpoints can affect cross-tenant records.
- Affected: `PUT /api/clinics`, `DELETE /api/clinics`
- Evidence: `src/app/api/clinics/route.ts` lines 60, 72, 76, 94
- Risk: doctor A can update/delete doctor B clinic by ID if discovered.

2. IDOR/BOLA: availability delete path lacks ownership validation.
- Affected: `DELETE /api/availability`
- Evidence: `src/app/api/availability/route.ts` lines 222, 229
- Risk: authenticated actor can delete availability rows by ID.

3. Tenant-boundary weakness: receptionist update/delete lacks doctor ownership check.
- Affected: `PUT /api/receptionists`, `DELETE /api/receptionists`
- Evidence: `src/app/api/receptionists/route.ts` lines 68, 80, 84, 91
- Risk: unauthorized modifications/removals across clinics.

### High

4. Notification mark-read by explicit IDs does not validate record ownership.
- Affected: `markNotificationsRead(userId, ids)` implementation
- Evidence: `src/lib/firebase/firestore.ts` lines 655, 659
- Risk: if notification IDs leak, one user may mark another user's notifications as read.

5. Role escalation path in user profile creation.
- Affected: `POST /api/users`
- Evidence: `src/app/api/users/route.ts` lines 29, 32, 33
- Risk: user can self-assign privileged role claims through profile creation path.

### Moderate

6. Next.js dependency vulnerability exposure still present.
- Evidence: `package.json` line 18 (`next`: 16.1.6)
- `npm audit --json` shows moderate advisories for Next.js in installed range.
- Fix target: upgrade to 16.2.3+ and retest.

7. Public read of clinic availability config lacks explicit policy guard.
- Affected: `GET /api/availability?clinicId=...`
- Evidence: `src/app/api/availability/route.ts` lines 78, 79
- Risk: operational schedule data exposure (depends on intended product policy).

### Low

8. Missing explicit security headers policy in framework config.
- Evidence: `next.config.ts` has no headers configuration.
- Lines: 4, 11

## Dependency Scan Snapshot

Source: `npm audit --json` (run 2026-04-09)

- Total: 9
- Critical: 0
- High: 0
- Moderate: 1
- Low: 8

Primary actionable item:
- Upgrade `next` from 16.1.6 to 16.2.3+

## Recommended Remediation Order

1. Close all IDOR/BOLA routes first (clinics, availability, receptionists).
2. Remove client-controlled role assignment in `POST /api/users`.
3. Add ownership verification in notification `ids` update path.
4. Upgrade Next.js and re-run security + regression checks.
5. Add integration tests for cross-tenant and role-escalation abuse cases.

## Verification Checklist After Fixes

1. Cross-tenant update/delete attempts return 403 for clinics/availability/receptionists.
2. Unauthorized role submission in `POST /api/users` returns 400/403 and does not alter claims.
3. Notification mark-read ignores/rejects IDs not owned by caller.
4. `npm audit` no longer reports the Next.js moderate advisories.
5. Integration tests cover tenant isolation and role boundaries.

---
README note: README remains project-focused and was intentionally not modified in this refresh.

