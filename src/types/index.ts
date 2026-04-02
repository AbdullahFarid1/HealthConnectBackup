export type UserRole = "patient" | "dentist" | "reception" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  clinicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  specialties: string[];
  address: string;
  phone: string;
  hours: Record<string, { open: string; close: string }>;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  clinicId: string;
  date: Date;
  timeSlot: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  dentistId: string;
  appointmentId: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string[];
  notes: string;
  createdAt: Date;
}

export interface QueueEntry {
  id: string;
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  position: number;
  status: "waiting" | "in-consultation" | "done";
  checkedInAt: Date;
}
