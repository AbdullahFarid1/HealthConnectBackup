import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  FileText,
  MessageSquare,
  Settings,
  Shield,
  Stethoscope,
  Timer,
  UserCircle,
  Users,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const patientNav: DashboardNavItem[] = [
  { href: "/o/patient", label: "Overview", icon: BarChart3 },
  { href: "/o/patient/book", label: "Book Appointment", icon: CalendarCheck2 },
  { href: "/o/patient/appointments", label: "My Appointments", icon: ClipboardList },
  { href: "/o/patient/records", label: "Medical Records", icon: FileText },
  { href: "/o/patient/profile", label: "Profile", icon: UserCircle },
];

export const dentistNav: DashboardNavItem[] = [
  { href: "/o/dentist", label: "Overview", icon: BarChart3 },
  { href: "/o/dentist/patients", label: "My Patients", icon: Stethoscope },
  { href: "/o/dentist/appointments", label: "Appointments", icon: ClipboardList },
  { href: "/o/dentist/reports", label: "Reports", icon: FileText },
  { href: "/o/dentist/profile", label: "Profile", icon: UserCircle },
];

export const receptionNav: DashboardNavItem[] = [
  { href: "/o/reception", label: "Overview", icon: BarChart3 },
  { href: "/o/reception/queue", label: "Queue", icon: Timer },
  { href: "/o/reception/appointments", label: "Today's Appointments", icon: CalendarCheck2 },
  { href: "/o/reception/messages", label: "Messages", icon: MessageSquare },
  { href: "/o/reception/profile", label: "Profile", icon: UserCircle },
];

export const adminNav: DashboardNavItem[] = [
  { href: "/o/admin", label: "Overview", icon: BarChart3 },
  { href: "/o/admin/users", label: "Manage Users", icon: Users },
  { href: "/o/admin/appointments", label: "Appointments", icon: CalendarCheck2 },
  { href: "/o/admin/analytics", label: "Analytics", icon: Shield },
  { href: "/o/admin/settings", label: "Settings", icon: Settings },
];
