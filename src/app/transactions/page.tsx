"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Transaction, TransactionCategory } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
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

const FILTER_CATEGORIES: (TransactionCategory | "all")[] = [
  "all",
  "food",
  "transport",
  "rent",
  "shopping",
  "income",
  "tuition",
  "utilities",
  "entertainment",
];

// ── Spending chart ────────────────────────────────────────────────────────────

function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const debits = transactions.filter((t) => t.amount < 0);

  const byCategory: Record<string, number> = {};
  for (const t of debits) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  }

  const data = Object.entries(byCategory)
    .map(([cat, total]) => ({
      name: CATEGORY_LABELS[cat] ?? cat,
      amount: Math.round(total),
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Spending by Category
      </h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [`$${v}`, "Spent"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="amount" fill="#5E8AC7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.amount > 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate">
          {txn.description}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[txn.category] ?? txn.category}
          </span>
          <span className="text-[11px] text-gray-400">{formatDate(txn.date)}</span>
        </div>
      </div>
      <span
        className={`text-sm font-semibold ml-3 shrink-0 ${
          isCredit ? "text-green-600" : "text-red-500"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(txn.amount)}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const [activeFilter, setActiveFilter] = useState<TransactionCategory | "all">("all");

  const filtered =
    activeFilter === "all"
      ? transactions
      : transactions.filter((t) => t.category === activeFilter);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <h1 className="text-white text-xl font-bold">Transactions</h1>
        <p className="text-blue-200 text-xs mt-0.5">May 2026</p>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Spending chart — always shows all transactions */}
        <SpendingChart transactions={transactions} />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_CATEGORIES.map((cat) => {
            const label = cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat);
            const active = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "text-white border-transparent"
                    : "text-gray-500 bg-white border-gray-200"
                }`}
                style={active ? { backgroundColor: "#0D3B66" } : {}}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-2">
          <div className="flex items-center justify-between py-2 mb-1">
            <h2 className="text-sm font-semibold text-gray-700">
              {activeFilter === "all" ? "All Transactions" : CATEGORY_LABELS[activeFilter]}
            </h2>
            <span className="text-xs text-gray-400">{filtered.length} items</span>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No transactions in this category.
            </p>
          ) : (
            filtered.map((txn) => <TransactionRow key={txn.id} txn={txn} />)
          )}
        </div>
      </div>
    </div>
  );
}
