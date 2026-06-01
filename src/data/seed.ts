import type { Transaction, CreditScoreEntry, UserProfile } from "@/types";

export const SEED_BALANCE = 1247.53;
export const SEED_THRESHOLD = 200;

export const SEED_PROFILE: UserProfile = {
  name: "Alex Johnson",
  school: "University of Michigan",
  year: "Junior",
  accountName: "Citibank Checking",
  accountLast4: "3003",
};

export const SEED_CREDIT_SCORE = 682;

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_001",
    date: "2026-05-28",
    description: "Whole Foods Market",
    category: "food",
    amount: -43.17,
  },
  {
    id: "txn_002",
    date: "2026-05-27",
    description: "May Work-Study Deposit",
    category: "income",
    amount: 620.0,
  },
  {
    id: "txn_003",
    date: "2026-05-25",
    description: "Ann Arbor AAATA Bus Pass",
    category: "transport",
    amount: -30.0,
  },
  {
    id: "txn_004",
    date: "2026-05-22",
    description: "Netflix",
    category: "entertainment",
    amount: -17.99,
  },
  {
    id: "txn_005",
    date: "2026-05-20",
    description: "Amazon — Textbooks",
    category: "shopping",
    amount: -89.95,
  },
  {
    id: "txn_006",
    date: "2026-05-15",
    description: "May Rent — 423 S State St",
    category: "rent",
    amount: -750.0,
  },
  {
    id: "txn_007",
    date: "2026-05-14",
    description: "DTE Energy",
    category: "utilities",
    amount: -58.42,
  },
  {
    id: "txn_008",
    date: "2026-05-10",
    description: "Chipotle",
    category: "food",
    amount: -12.85,
  },
  {
    id: "txn_009",
    date: "2026-05-05",
    description: "U-M Summer Tuition — Installment 1",
    category: "tuition",
    amount: -1800.0,
  },
  {
    id: "txn_010",
    date: "2026-05-01",
    description: "Parent Transfer",
    category: "income",
    amount: 500.0,
  },
];

export const SEED_CREDIT_HISTORY: CreditScoreEntry[] = [
  { date: "2025-12", score: 641 },
  { date: "2026-01", score: 655 },
  { date: "2026-02", score: 660 },
  { date: "2026-03", score: 670 },
  { date: "2026-04", score: 675 },
  { date: "2026-05", score: 682 },
];
