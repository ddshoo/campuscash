import { describe, it, expect } from "vitest";
import type { UpcomingBill } from "@/types";
import {
  hoursUntilDue,
  isBillAtRisk,
  shortfallAmount,
  suggestedTransfer,
  RISK_WINDOW_HOURS,
} from "./bills";

const NOW = new Date("2026-07-13T12:00:00Z").getTime();

function bill(overrides: Partial<UpcomingBill> = {}): UpcomingBill {
  return {
    id: "bill_test",
    name: "StreamPlus Premium",
    amount: 59.99,
    dueDate: new Date(NOW + 48 * 3_600_000).toISOString(),
    autopay: true,
    fundingSource: "Citibank Checking ••3003",
    ...overrides,
  };
}

describe("isBillAtRisk — derived, never stored", () => {
  it("flags a 48h-out charge the balance cannot cover", () => {
    expect(isBillAtRisk(bill(), 34.5, NOW)).toBe(true);
  });

  it("clears when the balance rises above the charge (the Move Funds path)", () => {
    expect(isBillAtRisk(bill(), 84.5, NOW)).toBe(false);
  });

  it("clears when the due date moves out of the window (the Snooze path)", () => {
    const snoozed = bill({
      dueDate: new Date(NOW + (RISK_WINDOW_HOURS + 96) * 3_600_000).toISOString(),
    });
    expect(isBillAtRisk(snoozed, 34.5, NOW)).toBe(false);
  });

  it("does not flag distant bills even when the balance is short", () => {
    const rent = bill({ amount: 750, dueDate: new Date(NOW + 13 * 86_400_000).toISOString() });
    expect(isBillAtRisk(rent, 34.5, NOW)).toBe(false);
  });

  it("still flags an overdue unpaid charge", () => {
    const overdue = bill({ dueDate: new Date(NOW - 3_600_000).toISOString() });
    expect(isBillAtRisk(overdue, 34.5, NOW)).toBe(true);
  });
});

describe("shortfall math", () => {
  it("computes the exact gap in cents", () => {
    expect(shortfallAmount(bill(), 34.5)).toBe(25.49);
  });

  it("is zero when covered", () => {
    expect(shortfallAmount(bill(), 100)).toBe(0);
  });

  it("suggests the next $25 increment above the gap", () => {
    expect(suggestedTransfer(bill(), 34.5)).toBe(50);
    expect(suggestedTransfer(bill(), 100)).toBe(0);
  });

  it("hoursUntilDue is 48 for the demo bill", () => {
    expect(hoursUntilDue(bill(), NOW)).toBeCloseTo(48);
  });
});
