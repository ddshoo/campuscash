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

// Hardcoded second card — demo placeholder, not in the store
const PNC_CARD = {
  accountName: "PNC Savings",
  accountLast4: "9421",
  balance: 2050.13,
  type: "Savings",
  color: "#F26522",
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

type CardProps = {
  accountName: string;
  accountLast4: string;
  balance: number;
  type: string;
  color: string;
};

function BankCard({ accountName, accountLast4, balance, type, color }: CardProps) {
  return (
    <div
      className="w-[85%] shrink-0 rounded-2xl p-5 shadow-md snap-start"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
            {accountName}
          </p>
          <p className="text-white/60 text-xs mt-0.5">•••• {accountLast4}</p>
        </div>
        <span className="text-white/80 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
          {type}
        </span>
      </div>
      <div>
        <p className="text-white text-3xl font-bold tracking-tight">
          {balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </p>
        <p className="text-white/60 text-xs mt-1">Available Now / Current Balance</p>
      </div>
    </div>
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

export default function BalancePage() {
  const balance = useAppStore((s) => s.balance);
  const transactions = useAppStore((s) => s.transactions);
  const profile = useAppStore((s) => s.profile);

  const recent = transactions.slice(0, 5);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Bank Balance</h1>
          <div className="flex items-center gap-3">
            {/* Placeholder: add account flow deferred */}
            <button
              aria-label="Add account"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
            >
              <PlusIcon />
            </button>
            <button
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
            >
              <BellIcon />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 py-4">
        {/* Horizontally scrollable cards */}
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth">
          <BankCard
            accountName={profile.accountName}
            accountLast4={profile.accountLast4}
            balance={balance}
            type="Checking"
            color="#5E8AC7"
          />
          <BankCard
            accountName={PNC_CARD.accountName}
            accountLast4={PNC_CARD.accountLast4}
            balance={PNC_CARD.balance}
            type={PNC_CARD.type}
            color={PNC_CARD.color}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-4">
          <Link
            href="/balance/alerts"
            className="flex-1 bg-navy text-white text-sm font-semibold text-center py-3 rounded-xl"
          >
            Edit Low Balance Alert
          </Link>
          <Link
            href="/transactions"
            className="flex-1 bg-white text-sm font-semibold text-center py-3 rounded-xl shadow-sm border border-gray-200"
            style={{ color: "#0D3B66" }}
          >
            History
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm mx-4 px-4 py-4">
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
