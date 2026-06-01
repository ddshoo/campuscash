export type TransactionCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "income"
  | "rent"
  | "utilities"
  | "tuition"
  | "other";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number; // positive = credit, negative = debit
};

export type CreditScoreEntry = {
  date: string; // "YYYY-MM"
  score: number;
};

export type UserProfile = {
  name: string;
  school: string;
  year: string;
  accountName: string;
  accountLast4: string;
};
