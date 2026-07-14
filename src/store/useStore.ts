import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Transaction,
  CreditScoreEntry,
  UserProfile,
  RoutingState,
  UpcomingBill,
  PaymentArchitecture,
  TransactionCategory,
  ViewMode,
} from "@/types";
import {
  SEED_BALANCE,
  SEED_THRESHOLD,
  SEED_SAVINGS_BALANCE,
  SEED_PROFILE,
  SEED_CREDIT_SCORE,
  SEED_TRANSACTIONS,
  SEED_CREDIT_HISTORY,
  makeSeedBills,
} from "@/data/seed";

const roundCents = (value: number) => Math.round(value * 100) / 100;

type AppState = {
  // ── Accounts ──
  balance: number;
  savingsBalance: number;
  threshold: number;

  // ── Upcoming bills (shortfall engine reads these + balance) ──
  upcomingBills: UpcomingBill[];

  // ── Checkout engine routing (Feature C architecture toggle) ──
  paymentArchitecture: PaymentArchitecture;

  // ── Demo presentation: consumer view vs engineering internals ──
  viewMode: ViewMode;

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
  /** Prepends pipeline-ingested transactions and reconciles the balance. */
  ingestTransactions: (incoming: Transaction[]) => void;
  /** Patches one transaction in place (categorization pipeline updates). */
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  /** Scenario-only: force the checking balance to an exact value. */
  overrideBalance: (value: number) => void;
  addBill: (bill: UpcomingBill) => void;
  updateBill: (id: string, patch: Partial<UpcomingBill>) => void;
  removeBill: (id: string) => void;
  /** Moves money savings → checking and records it as a ledger entry.
   *  Clamped to available savings; no-ops on non-positive amounts. */
  transferFromSavings: (amount: number) => void;
  setPaymentArchitecture: (mode: PaymentArchitecture) => void;
  setViewMode: (mode: ViewMode) => void;
  /** Executes a native in-app payment: debits the funding account, records
   *  the ledger entry, and settles any matching upcoming bill early. */
  applyPayment: (payment: {
    payee: string;
    amount: number;
    source: "checking" | "savings";
    category: TransactionCategory;
  }) => void;
  /** Dev-panel escape hatch: restore every field to the seed snapshot. */
  resetDemo: () => void;
};

/** Keys that survive a reload. routingState is intentionally omitted:
 *  rehydrating a mid-flight pipeline state would desync the UI ticker. */
type PersistedState = Pick<
  AppState,
  | "balance"
  | "savingsBalance"
  | "threshold"
  | "upcomingBills"
  | "paymentArchitecture"
  | "viewMode"
  | "transactions"
  | "creditScore"
  | "creditHistory"
  | "profile"
>;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      balance: SEED_BALANCE,
      savingsBalance: SEED_SAVINGS_BALANCE,
      threshold: SEED_THRESHOLD,
      upcomingBills: makeSeedBills(),
      paymentArchitecture: "native",
      viewMode: "engineering",
      transactions: SEED_TRANSACTIONS,
      creditScore: SEED_CREDIT_SCORE,
      creditHistory: SEED_CREDIT_HISTORY,
      profile: SEED_PROFILE,

      routingState: "idle",

      setThreshold: (value) => set({ threshold: value }),
      setRoutingState: (routingState) => set({ routingState }),
      ingestTransactions: (incoming) =>
        set((state) => ({
          transactions: [...incoming, ...state.transactions],
          // Debits arrive as negative amounts, so a plain sum reconciles both
          balance:
            Math.round(
              (state.balance +
                incoming.reduce((sum, t) => sum + t.amount, 0)) *
                100
            ) / 100,
        })),
      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),
      overrideBalance: (value) => set({ balance: roundCents(value) }),
      addBill: (bill) =>
        set((state) => ({ upcomingBills: [...state.upcomingBills, bill] })),
      updateBill: (id, patch) =>
        set((state) => ({
          upcomingBills: state.upcomingBills.map((b) =>
            b.id === id ? { ...b, ...patch } : b
          ),
        })),
      removeBill: (id) =>
        set((state) => ({
          upcomingBills: state.upcomingBills.filter((b) => b.id !== id),
        })),
      transferFromSavings: (amount) =>
        set((state) => {
          const moved = Math.min(roundCents(amount), state.savingsBalance);
          if (moved <= 0) return state;
          const entry: Transaction = {
            id: `txn_transfer_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            description: "Transfer from PNC Savings",
            category: "other",
            amount: moved,
          };
          return {
            balance: roundCents(state.balance + moved),
            savingsBalance: roundCents(state.savingsBalance - moved),
            transactions: [entry, ...state.transactions],
          };
        }),
      setPaymentArchitecture: (paymentArchitecture) =>
        set({ paymentArchitecture }),
      setViewMode: (viewMode) => set({ viewMode }),
      applyPayment: ({ payee, amount, source, category }) =>
        set((state) => {
          const debit = roundCents(amount);
          if (debit <= 0) return state;
          const entry: Transaction = {
            id: `txn_payment_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            description: payee,
            category,
            amount: -debit,
          };
          return {
            balance:
              source === "checking"
                ? roundCents(state.balance - debit)
                : state.balance,
            savingsBalance:
              source === "savings"
                ? roundCents(state.savingsBalance - debit)
                : state.savingsBalance,
            transactions: [entry, ...state.transactions],
            // Paying a tracked bill in full settles it early — the predictive
            // timeline should stop forecasting a charge that already cleared
            upcomingBills: state.upcomingBills.filter(
              (b) => !(b.name === payee && debit >= b.amount)
            ),
          };
        }),
      resetDemo: () =>
        set({
          balance: SEED_BALANCE,
          savingsBalance: SEED_SAVINGS_BALANCE,
          threshold: SEED_THRESHOLD,
          upcomingBills: makeSeedBills(),
          paymentArchitecture: "native",
          viewMode: "engineering",
          transactions: SEED_TRANSACTIONS,
          creditScore: SEED_CREDIT_SCORE,
          creditHistory: SEED_CREDIT_HISTORY,
          profile: SEED_PROFILE,
          routingState: "idle",
        }),
    }),
    {
      name: "campuscash",
      partialize: (state): PersistedState => ({
        balance: state.balance,
        savingsBalance: state.savingsBalance,
        threshold: state.threshold,
        upcomingBills: state.upcomingBills,
        paymentArchitecture: state.paymentArchitecture,
        viewMode: state.viewMode,
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
