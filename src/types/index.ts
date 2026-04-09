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
  consultationFee?: number;
  bio?: string;
  /** Optional public profile image URL (shown on doctor cards). */
  photoUrl?: string;
  // Receptionist-specific
  assignedClinicIds?: string[];
  invitedByDoctorId?: string;
  inviteStatus?: "invited" | "joined";
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

// ─── Notifications ────────────────────────────────────────
export type NotificationType =
  | "booked"
  | "cancelled"
  | "rescheduled"
  | "completed"
  | "auto-confirmed"
  | "auto-cancelled";

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
