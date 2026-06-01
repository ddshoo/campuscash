import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, CreditScoreEntry, UserProfile } from "@/types";
import {
  SEED_BALANCE,
  SEED_THRESHOLD,
  SEED_PROFILE,
  SEED_CREDIT_SCORE,
  SEED_TRANSACTIONS,
  SEED_CREDIT_HISTORY,
} from "@/data/seed";

type AppState = {
  // Account
  balance: number;
  threshold: number;

  // Transactions
  transactions: Transaction[];

  // Credit
  creditScore: number;
  creditHistory: CreditScoreEntry[];

  // Profile
  profile: UserProfile;

  // Actions
  setThreshold: (value: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      balance: SEED_BALANCE,
      threshold: SEED_THRESHOLD,
      transactions: SEED_TRANSACTIONS,
      creditScore: SEED_CREDIT_SCORE,
      creditHistory: SEED_CREDIT_HISTORY,
      profile: SEED_PROFILE,

      setThreshold: (value) => set({ threshold: value }),
    }),
    {
      name: "campuscash",
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
