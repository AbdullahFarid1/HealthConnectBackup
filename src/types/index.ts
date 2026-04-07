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
  /** Optional GPS coordinates so patients can navigate via Google Maps. */
  latitude?: number;
  longitude?: number;
  /** Optional Google Maps link (paste from Google Maps "Share" → "Copy link"). */
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
