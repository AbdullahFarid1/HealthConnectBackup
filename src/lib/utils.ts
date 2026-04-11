import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip a CNIC input down to digits only. Users typically type the
 * 13-digit Pakistani CNIC with dashes (e.g. "42101-1234567-1"); we
 * normalize to "4210112345671" for storage.
 */
export function normalizeCnic(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

/** True if the value is a valid 13-digit Pakistani CNIC (digits only). */
export function isValidCnic(value: string): boolean {
  return /^\d{13}$/.test(normalizeCnic(value));
}

/** Format a 13-digit CNIC as XXXXX-XXXXXXX-X for display. */
export function formatCnic(value: string): string {
  const digits = normalizeCnic(value);
  if (digits.length !== 13) return value;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}
