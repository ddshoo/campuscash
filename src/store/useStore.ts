import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Transaction,
  CreditScoreEntry,
  UserProfile,
  RoutingState,
} from "@/types";
import {
  SEED_BALANCE,
  SEED_THRESHOLD,
  SEED_PROFILE,
  SEED_CREDIT_SCORE,
  SEED_TRANSACTIONS,
  SEED_CREDIT_HISTORY,
} from "@/data/seed";

type AppState = {
  // ── Account (threshold is the ONLY user-mutable financial field) ──
  balance: number;
  threshold: number;

  // ── Transactions (all 10 — fed verbatim to the model context) ──
  transactions: Transaction[];

  // ── Credit ──
  creditScore: number;
  creditHistory: CreditScoreEntry[];

  // ── Profile ──
  profile: UserProfile;

  // ── Agent routing engine (transient — never persisted) ──
  routingState: RoutingState;

  // ── Actions ──
  setThreshold: (value: number) => void;
  setRoutingState: (state: RoutingState) => void;
};

/** Keys that survive a reload. routingState is intentionally omitted:
 *  rehydrating a mid-flight pipeline state would desync the UI ticker. */
type PersistedState = Pick<
  AppState,
  | "balance"
  | "threshold"
  | "transactions"
  | "creditScore"
  | "creditHistory"
  | "profile"
>;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      balance: SEED_BALANCE,
      threshold: SEED_THRESHOLD,
      transactions: SEED_TRANSACTIONS,
      creditScore: SEED_CREDIT_SCORE,
      creditHistory: SEED_CREDIT_HISTORY,
      profile: SEED_PROFILE,

      routingState: "idle",

      setThreshold: (value) => set({ threshold: value }),
      setRoutingState: (routingState) => set({ routingState }),
    }),
    {
      name: "campuscash",
      partialize: (state): PersistedState => ({
        balance: state.balance,
        threshold: state.threshold,
        transactions: state.transactions,
        creditScore: state.creditScore,
        creditHistory: state.creditHistory,
        profile: state.profile,
      }),
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const item = window.localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(name);
        },
      },
    }
  )
);
