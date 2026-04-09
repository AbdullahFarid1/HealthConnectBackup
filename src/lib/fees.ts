/**
 * HealthConnect fee model (simulated).
 *
 * - Platform fee: 2% of the doctor's consultation fee (kept by HealthConnect).
 * - Tax: 5% sales tax on the consultation fee.
 * - Patient pays: consultationFee + platformFee + tax.
 *
 * On patient/doctor cancellation:
 *   Refund = total - platformFee  (i.e. consultationFee + tax).
 *   Platform always retains the 2% fee per business rules.
 */

export const PLATFORM_FEE_RATE = 0.02; // 2%
export const TAX_RATE = 0.05;          // 5%

export interface FeeBreakdown {
  consultationFee: number;
  platformFee: number;
  tax: number;
  total: number;
}

export function computeFees(consultationFee: number): FeeBreakdown {
  const fee = Math.max(0, Math.round(consultationFee || 0));
  const platformFee = Math.round(fee * PLATFORM_FEE_RATE);
  const tax = Math.round(fee * TAX_RATE);
  const total = fee + platformFee + tax;
  return { consultationFee: fee, platformFee, tax, total };
}

export function computeRefund(b: FeeBreakdown): number {
  // Patient gets everything back EXCEPT the platform fee.
  return b.total - b.platformFee;
}

export function formatPKR(n: number): string {
  return `PKR ${Math.round(n).toLocaleString()}`;
}
