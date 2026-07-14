import type { TransactionCategory } from "@/types";

export function formatCurrency(amount: number) {
  return Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food: "Food",
  transport: "Transport",
  entertainment: "Entertainment",
  shopping: "Shopping",
  income: "Income",
  rent: "Rent",
  utilities: "Utilities",
  tuition: "Tuition",
  other: "Other",
};
