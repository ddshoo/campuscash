"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import type { Transaction } from "@/types";

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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

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

export default function HomePage() {
  const balance = useAppStore((s) => s.balance);
  const threshold = useAppStore((s) => s.threshold);
  const transactions = useAppStore((s) => s.transactions);
  const profile = useAppStore((s) => s.profile);

  const recent = transactions.slice(0, 5);
  const isBelowThreshold = balance < threshold;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">
              Welcome back
            </p>
            <h1 className="text-white text-2xl font-bold mt-0.5">
              Hello, {profile.name.split(" ")[0]}
            </h1>
          </div>
          <button
            aria-label="Notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <BellIcon />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Bank Card */}
        <div
          className="rounded-2xl p-5 shadow-md"
          style={{ backgroundColor: "#5E8AC7" }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                {profile.accountName}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                •••• {profile.accountLast4}
              </p>
            </div>
            <span className="text-white/80 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
              Checking
            </span>
          </div>
          <div>
            <p className="text-white text-3xl font-bold tracking-tight">
              {balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
            <p className="text-white/60 text-xs mt-1">
              Available Now / Current Balance
            </p>
          </div>
        </div>

        {/* Low Balance Warning */}
        {isBelowThreshold && (
          <Link href="/balance/alerts">
            <div className="bg-orange/10 border border-orange rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange text-lg">⚠️</span>
                <div>
                  <p className="text-orange text-sm font-semibold">
                    Low Balance Alert
                  </p>
                  <p className="text-orange/80 text-xs">
                    Balance is below your{" "}
                    {threshold.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    threshold
                  </p>
                </div>
              </div>
              <span className="text-orange text-sm">›</span>
            </div>
          </Link>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Transactions
            </h2>
            <Link
              href="/transactions"
              className="text-xs font-medium"
              style={{ color: "#F26522" }}
            >
              See all
            </Link>
          </div>
          <div>
            {recent.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
