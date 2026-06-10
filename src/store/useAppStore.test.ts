import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";
import {
  SEED_BALANCE,
  SEED_THRESHOLD,
  SEED_CREDIT_SCORE,
  SEED_TRANSACTIONS,
  SEED_CREDIT_HISTORY,
  SEED_PROFILE,
} from "@/data/seed";

beforeEach(() => {
  useAppStore.setState({
    balance: SEED_BALANCE,
    threshold: SEED_THRESHOLD,
    creditScore: SEED_CREDIT_SCORE,
    transactions: SEED_TRANSACTIONS,
    creditHistory: SEED_CREDIT_HISTORY,
    profile: SEED_PROFILE,
  });
});

describe("useAppStore — initial state", () => {
  it("balance matches seed data", () => {
    expect(useAppStore.getState().balance).toBe(SEED_BALANCE);
  });

  it("threshold matches seed data", () => {
    expect(useAppStore.getState().threshold).toBe(SEED_THRESHOLD);
  });

  it("creditScore matches seed data", () => {
    expect(useAppStore.getState().creditScore).toBe(SEED_CREDIT_SCORE);
  });

  it("transactions array matches seed data length", () => {
    expect(useAppStore.getState().transactions).toHaveLength(
      SEED_TRANSACTIONS.length
    );
  });
});

describe("useAppStore — setThreshold", () => {
  it("updates threshold to the new value", () => {
    useAppStore.getState().setThreshold(500);
    expect(useAppStore.getState().threshold).toBe(500);
  });

  it("updates threshold to zero", () => {
    useAppStore.getState().setThreshold(0);
    expect(useAppStore.getState().threshold).toBe(0);
  });

  it("accepts a negative value — validation is the UI's responsibility", () => {
    useAppStore.getState().setThreshold(-100);
    expect(useAppStore.getState().threshold).toBe(-100);
  });

  it("does not mutate balance or other fields", () => {
    useAppStore.getState().setThreshold(999);
    expect(useAppStore.getState().balance).toBe(SEED_BALANCE);
    expect(useAppStore.getState().creditScore).toBe(SEED_CREDIT_SCORE);
  });
});
