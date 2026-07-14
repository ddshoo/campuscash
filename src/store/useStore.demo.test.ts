import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";
import {
  SEED_BALANCE,
  SEED_SAVINGS_BALANCE,
  SEED_TRANSACTIONS,
  makeSeedBills,
} from "@/data/seed";
import type { Transaction } from "@/types";

function rawTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn_raw_test",
    date: "2026-07-13",
    description: "SQ *STUDENT COFFEE 0942",
    category: "other",
    amount: -6.4,
    status: "raw",
    rawDescriptor: "SQ *STUDENT COFFEE 0942",
    ...overrides,
  };
}

beforeEach(() => {
  useStore.getState().resetDemo();
});

describe("ingestTransactions", () => {
  it("prepends payloads and reconciles the balance from signed amounts", () => {
    useStore.getState().ingestTransactions([
      rawTxn({ id: "a", amount: -6.4 }),
      rawTxn({ id: "b", amount: -18.75 }),
    ]);
    const state = useStore.getState();
    expect(state.transactions[0].id).toBe("a");
    expect(state.transactions).toHaveLength(SEED_TRANSACTIONS.length + 2);
    expect(state.balance).toBeCloseTo(SEED_BALANCE - 6.4 - 18.75, 2);
  });
});

describe("updateTransaction", () => {
  it("patches only the targeted transaction", () => {
    useStore.getState().ingestTransactions([rawTxn({ id: "a" })]);
    useStore.getState().updateTransaction("a", {
      status: "categorized",
      category: "food",
      confidence: 0.91,
      description: "Student Coffee",
    });
    const [first, second] = useStore.getState().transactions;
    expect(first.category).toBe("food");
    expect(first.status).toBe("categorized");
    expect(second).toEqual(SEED_TRANSACTIONS[0]);
  });
});

describe("transferFromSavings", () => {
  it("moves money between accounts and records a ledger entry", () => {
    useStore.getState().transferFromSavings(50);
    const state = useStore.getState();
    expect(state.balance).toBeCloseTo(SEED_BALANCE + 50, 2);
    expect(state.savingsBalance).toBeCloseTo(SEED_SAVINGS_BALANCE - 50, 2);
    expect(state.transactions[0].description).toBe(
      "Transfer from PNC Savings"
    );
    expect(state.transactions[0].amount).toBe(50);
  });

  it("clamps to the available savings balance", () => {
    useStore.getState().transferFromSavings(999_999);
    const state = useStore.getState();
    expect(state.savingsBalance).toBe(0);
    expect(state.balance).toBeCloseTo(SEED_BALANCE + SEED_SAVINGS_BALANCE, 2);
  });

  it("ignores non-positive amounts", () => {
    useStore.getState().transferFromSavings(-10);
    expect(useStore.getState().balance).toBe(SEED_BALANCE);
    expect(useStore.getState().transactions).toHaveLength(
      SEED_TRANSACTIONS.length
    );
  });
});

describe("bills", () => {
  it("addBill and updateBill manage the timeline", () => {
    useStore.getState().addBill({
      id: "bill_x",
      name: "StreamPlus Premium",
      amount: 59.99,
      dueDate: "2026-07-15T12:00:00.000Z",
      autopay: true,
      fundingSource: "Citibank Checking ••3003",
    });
    expect(useStore.getState().upcomingBills).toHaveLength(
      makeSeedBills().length + 1
    );

    useStore.getState().updateBill("bill_x", { snoozed: true });
    expect(
      useStore.getState().upcomingBills.find((b) => b.id === "bill_x")?.snoozed
    ).toBe(true);
  });
});

describe("applyPayment", () => {
  it("debits checking, records the transaction, and settles a matching bill", () => {
    useStore.getState().addBill({
      id: "bill_x",
      name: "StreamPlus Premium",
      amount: 59.99,
      dueDate: "2026-07-15T12:00:00.000Z",
      autopay: true,
      fundingSource: "Citibank Checking ••3003",
    });
    useStore.getState().applyPayment({
      payee: "StreamPlus Premium",
      amount: 59.99,
      source: "checking",
      category: "entertainment",
    });
    const state = useStore.getState();
    expect(state.balance).toBeCloseTo(SEED_BALANCE - 59.99, 2);
    expect(state.transactions[0].amount).toBe(-59.99);
    expect(state.transactions[0].category).toBe("entertainment");
    expect(
      state.upcomingBills.find((b) => b.name === "StreamPlus Premium")
    ).toBeUndefined();
  });

  it("a partial payment does not settle the tracked bill", () => {
    useStore.getState().addBill({
      id: "bill_x",
      name: "StreamPlus Premium",
      amount: 59.99,
      dueDate: "2026-07-15T12:00:00.000Z",
      autopay: true,
      fundingSource: "Citibank Checking ••3003",
    });
    useStore.getState().applyPayment({
      payee: "StreamPlus Premium",
      amount: 10,
      source: "checking",
      category: "entertainment",
    });
    expect(
      useStore.getState().upcomingBills.find(
        (b) => b.name === "StreamPlus Premium"
      )
    ).toBeDefined();
  });

  it("debits savings when selected as the funding source", () => {
    useStore.getState().applyPayment({
      payee: "U-M Student Account",
      amount: 100,
      source: "savings",
      category: "tuition",
    });
    const state = useStore.getState();
    expect(state.balance).toBe(SEED_BALANCE);
    expect(state.savingsBalance).toBeCloseTo(SEED_SAVINGS_BALANCE - 100, 2);
  });
});

describe("resetDemo", () => {
  it("restores every demo field to the seed snapshot", () => {
    useStore.getState().overrideBalance(34.5);
    useStore.getState().setPaymentArchitecture("legacy");
    useStore.getState().ingestTransactions([rawTxn()]);

    useStore.getState().resetDemo();

    const state = useStore.getState();
    expect(state.balance).toBe(SEED_BALANCE);
    expect(state.savingsBalance).toBe(SEED_SAVINGS_BALANCE);
    expect(state.paymentArchitecture).toBe("native");
    expect(state.transactions).toHaveLength(SEED_TRANSACTIONS.length);
    expect(state.upcomingBills).toHaveLength(makeSeedBills().length);
  });
});
