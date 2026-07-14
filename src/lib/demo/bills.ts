import type { UpcomingBill } from "@/types";

/** A charge inside this window with insufficient balance is "at risk".
 *  Wider than the demo's 48h bill on purpose: a real predictive engine warns
 *  before the last minute, not at it. */
export const RISK_WINDOW_HOURS = 72;

export function hoursUntilDue(bill: UpcomingBill, now = Date.now()): number {
  return (new Date(bill.dueDate).getTime() - now) / 3_600_000;
}

/**
 * Derived, never stored: risk is a pure function of (bill, balance, clock).
 * That's why "Move Funds" and "Snooze" clear the alert without any flag
 * bookkeeping — raising the balance or pushing the due date makes the
 * condition itself false.
 */
export function isBillAtRisk(
  bill: UpcomingBill,
  balance: number,
  now = Date.now()
): boolean {
  const hours = hoursUntilDue(bill, now);
  return hours <= RISK_WINDOW_HOURS && bill.amount > balance;
}

export function shortfallAmount(bill: UpcomingBill, balance: number): number {
  return Math.max(0, Math.round((bill.amount - balance) * 100) / 100);
}

/** Shortfall rounded up to the next $25 — a realistic transfer suggestion
 *  rather than a to-the-penny amount. */
export function suggestedTransfer(bill: UpcomingBill, balance: number): number {
  const shortfall = shortfallAmount(bill, balance);
  return shortfall === 0 ? 0 : Math.ceil(shortfall / 25) * 25;
}
