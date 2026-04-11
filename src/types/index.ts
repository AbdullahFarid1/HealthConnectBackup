// ─── Role Constants ──────────────────────────────────────
export const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  RECEPTION: "reception",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Maps each role to its Firestore collection name */
export const ROLE_COLLECTIONS: Record<UserRole, string> = {
  patient: "patients",
  doctor: "doctors",
  reception: "receptionists",
  admin: "admins",
};

export type SlotDuration = 15 | 30 | 45 | 60;

// ─── Receptionist Permissions & Invites ─────────────────────
/**
 * Granular per-doctor permissions for a receptionist. Both the UI and the
 * backend APIs must enforce these — toggling a flag here instantly revokes
 * the ability on the next request.
 */
export interface ReceptionistPermissions {
  cancel: boolean;
  reschedule: boolean;
  viewPatientDetails: boolean;
  manageQueue: boolean;
  markCompletion: boolean;
}

export const DEFAULT_RECEPTIONIST_PERMISSIONS: ReceptionistPermissions = {
  cancel: true,
  reschedule: true,
  viewPatientDetails: true,
  manageQueue: true,
  markCompletion: true,
};

/** Per-doctor invite lifecycle. Each doctor holds an independent slot. */
export type DoctorInviteStatusValue =
  | "invited"
  | "accepted"
  | "active"
  | "rejected"
  | "expired";

export interface DoctorInviteState {
  status: DoctorInviteStatusValue;
  invitedAt: string;
  /** Invites auto-expire 48h after `invitedAt` unless accepted first. */
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  /** Clinics the receptionist is assigned to for this specific doctor. */
  clinicIds: string[];
}

/** 48 hour invite window. */
export const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000;

/** The shape stored in Firestore (timestamps as ISO strings) */
export interface UserProfileDoc {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city?: string;
  // Doctor-specific
  specialty?: string;
  pmdcRegistrationNo?: string;
  /** Pakistani CNIC stored as a 13-digit string (no dashes). Required for doctors — used for PMDC verification. */
  cnic?: string;
  consultationFee?: number;
  bio?: string;
  /** Optional public profile image URL (shown on doctor cards). */
  photoUrl?: string;
  // Patient-specific
  age?: number;
  /** Date of birth in YYYY-MM-DD format. */
  dob?: string;
  gender?: "male" | "female" | "other";
  // Doctor ratings aggregate — maintained in a transaction when a review is
  // created or updated so doctor cards/dashboards can read it in one hop.
  ratingAverage?: number;
  ratingCount?: number;
  ratingSum?: number;
  // Receptionist-specific (multi-doctor)
  /** All doctors who have linked this receptionist — new or existing. */
  invitedByDoctorIds?: string[];
  /** Per-doctor invite state (pending → accepted → active → rejected/expired). */
  doctorInviteStatuses?: Record<string, DoctorInviteState>;
  /** Per-doctor permissions — each doctor can configure what this receptionist may do. */
  doctorPermissions?: Record<string, ReceptionistPermissions>;
  /**
   * True until the receptionist has completed a forced password reset after
   * first login (newly-created accounts only). While true, they are blocked
   * from all routes except /auth/reset-password.
   */
  mustResetPassword?: boolean;
  // Shared
  createdAt: string;
  updatedAt: string;
}

// ─── Clinics ──────────────────────────────────────────────
export interface ClinicDoc {
  id: string;
  doctorId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  /** Google Maps link captured via the "Attach Location" picker. */
  mapUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Availability ─────────────────────────────────────────
/** One availability block for a clinic on a specific day */
export interface AvailabilityDoc {
  id: string;
  doctorId: string;
  clinicId: string;
  /** 0=Sun, 1=Mon, ... 6=Sat — derived from specificDate when repeatWeekly=false. */
  dayOfWeek: number;
  /** When true, the block repeats every week on dayOfWeek. When false, it
   *  applies only to specificDate (YYYY-MM-DD). Defaults to false going
   *  forward; legacy docs without this field are treated as recurring. */
  repeatWeekly?: boolean;
  /** YYYY-MM-DD — required when repeatWeekly is false. */
  specificDate?: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDuration: SlotDuration;
  createdAt: string;
  updatedAt: string;
}

// ─── Appointments ─────────────────────────────────────────
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

/** Simulated escrow / payment lifecycle for an appointment. */
export type PaymentStatus =
  | "unpaid"
  | "held"        // funds in escrow, appointment confirmed
  | "released"    // paid out to doctor after dual confirmation
  | "refunded";   // patient cancelled / refunded

export interface AppointmentPayment {
  consultationFee: number; // doctor's base fee (PKR)
  platformFee: number;     // 2% of consultationFee
  tax: number;             // 5% sales tax on consultationFee
  total: number;           // consultationFee + platformFee + tax
  status: PaymentStatus;
  paidAt?: string;
  refundedAt?: string;
  releasedAt?: string;
  refundAmount?: number;   // what the patient got back on cancellation
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  /** Snapshotted at booking time from the patient profile. */
  patientPhone?: string;
  /** Snapshotted at booking time from the patient profile (optional). */
  patientAge?: number;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  type: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;

  // ─── Payment / escrow (simulated) ────────────────────
  payment?: AppointmentPayment;

  /** Length of the slot in minutes — used to compute slot end time client-side. */
  slotDuration?: SlotDuration;

  // ─── Dual completion confirmation ────────────────────
  doctorConfirmedCompleted?: boolean;
  doctorConfirmedAt?: string;
  patientConfirmedCompleted?: boolean;
  patientConfirmedAt?: string;
  completedAt?: string;
  /** Set when the system auto-confirmed the missing side. */
  autoConfirmedBy?: "doctor" | "patient" | "both";

  // ─── Ratings & feedback (after completion) ───────────
  doctorRating?: number;   // 1..5
  platformRating?: number; // 1..5
  feedback?: string;

  // ─── Queue / check-in state (managed by reception or doctor) ─
  /**
   * Per-appointment check-in state driven from the receptionist queue.
   *   waiting     — booked but not yet arrived (default for confirmed)
   *   arrived     — receptionist marked the patient as present in the clinic
   *   in-progress — doctor started the consultation
   *   done        — visit finished (receptionist/doctor)
   * This is independent of the payment / completion confirmation flow.
   */
  checkInStatus?: "waiting" | "arrived" | "in-progress" | "done";
  /** Timestamp of the last check-in transition. */
  checkInUpdatedAt?: string;

  // ─── Audit ───────────────────────────────────────────
  /** The last actor to mutate the appointment — updated on every PATCH. */
  actionBy?: { uid: string; role: UserRole; at: string };
  /** Full audit trail of every mutation so doctors can see who did what. */
  actionHistory?: Array<{
    action: string;
    uid: string;
    role: UserRole;
    at: string;
    /** Optional note describing what happened (e.g. "Cancelled: not feeling well"). */
    note?: string;
  }>;

  // ─── Cancellation / reschedule audit ─────────────────
  cancelReason?: string;
  cancelledBy?: "patient" | "doctor";
  rescheduleReason?: string;
  rescheduledBy?: "patient" | "doctor";
  /** Set when the doctor reschedules — patient must confirm or cancel. */
  pendingPatientConfirmation?: boolean;
  rescheduleProposedAt?: string;
  rescheduleHistory?: Array<{
    fromDate: string;
    fromTimeSlot: string;
    by: "patient" | "doctor";
    reason: string;
    at: string;
  }>;
}

// ─── Reviews ──────────────────────────────────────────────
/**
 * Public patient review for a doctor. Doc ID is `${doctorId}_${patientId}`
 * so there is at most one review per (patient, doctor) pair — patients can
 * update their review, but never create duplicates.
 */
export interface ReviewDoc {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────
export type NotificationType =
  | "booked"
  | "cancelled"
  | "rescheduled"
  | "completed"
  | "auto-confirmed"
  | "auto-cancelled"
  | "invite-received"
  | "invite-accepted"
  | "invite-rejected"
  | "patient-arrived";

export interface NotificationDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ─── Medical Records ──────────────────────────────────────
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string[];
  notes: string;
  createdAt: string;
}

// ─── Queue ────────────────────────────────────────────────
export interface QueueEntry {
  id: string;
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  position: number;
  status: "waiting" | "in-consultation" | "done";
  checkedInAt: string;
}
