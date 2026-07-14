"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Transaction, TransactionCategory } from "@/types";
import TransactionRow from "@/components/TransactionRow";
import { CATEGORY_LABELS } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

/** Placeholder bars while the categorization pipeline is running — the chart
 *  can't segment spending it hasn't classified yet. */
function ChartSkeleton() {
  const heights = [72, 104, 56, 88, 40, 64];
  return (
    <div className="flex items-end gap-3 h-[160px] px-2 pb-5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t skeleton-shimmer"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function SpendingChart({
  transactions,
  pendingCount,
}: {
  transactions: Transaction[];
  pendingCount: number;
}) {
  // Only classified spend is chartable — raw/processing rows are excluded
  const debits = transactions.filter(
    (t) => t.amount < 0 && (!t.status || t.status === "categorized")
  );

  const byCategory: Record<string, number> = {};
  for (const t of debits) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  }

  const data = Object.entries(byCategory)
    .map(([cat, total]) => ({
      name: CATEGORY_LABELS[cat as TransactionCategory] ?? cat,
      amount: Math.round(total),
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Spending by Category
        </h2>
        {pendingCount > 0 && (
          <span className="text-[10px] font-medium text-amber-600 animate-pulse">
            categorizing {pendingCount}…
          </span>
        )}
      </div>
      {pendingCount > 0 ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
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
      )}
    </div>
  );
}

// ── Uncategorized banner ─────────────────────────────────────────────────────

function UncategorizedBanner({ count }: { count: number }) {
  return (
    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 animate-[fade-slide-in_0.3s_ease-out]">
      <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-amber-800">
          {count} transaction{count === 1 ? "" : "s"} arrived uncategorized
        </p>
        <p className="text-[11px] text-amber-700 mt-0.5">
          Category filters and spending insights are paused until they&apos;re
          classified.
        </p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const [activeFilter, setActiveFilter] = useState<TransactionCategory | "all">(
    "all"
  );

  const pendingCount = transactions.filter(
    (t) => t.status === "raw" || t.status === "processing"
  ).length;

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
        {pendingCount > 0 && <UncategorizedBanner count={pendingCount} />}

        {/* Spending chart — always shows all classified transactions */}
        <SpendingChart transactions={transactions} pendingCount={pendingCount} />

        {/* Category filter — the original "dead filters" finding: these are
            useless while transactions sit unclassified, so they pause */}
        <div
          className={`flex gap-2 overflow-x-auto pb-1 no-scrollbar transition-opacity duration-300 ${
            pendingCount > 0 ? "opacity-40 pointer-events-none" : ""
          }`}
          aria-disabled={pendingCount > 0}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const label = cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat);
            const active = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                disabled={pendingCount > 0}
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
              {activeFilter === "all"
                ? "All Transactions"
                : CATEGORY_LABELS[activeFilter]}
            </h2>
            <span className="text-xs text-gray-400">
              {filtered.length} items
            </span>
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
