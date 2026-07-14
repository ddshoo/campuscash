"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import TransactionRow from "@/components/TransactionRow";
import PaymentSection from "@/components/payment/PaymentSection";

import { SEED_SAVINGS_ACCOUNT } from "@/data/seed";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
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

export default function BalancePage() {
  const balance = useAppStore((s) => s.balance);
  const savingsBalance = useAppStore((s) => s.savingsBalance);
  const transactions = useAppStore((s) => s.transactions);
  const profile = useAppStore((s) => s.profile);

  const recent = transactions.slice(0, 5);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Bank Balance</h1>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <BellIcon />
          </Link>
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
            accountName={SEED_SAVINGS_ACCOUNT.accountName}
            accountLast4={SEED_SAVINGS_ACCOUNT.accountLast4}
            balance={savingsBalance}
            type="Savings"
            color="#F26522"
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

        {/* Checkout surface — engine chosen by the architecture toggle */}
        <PaymentSection />

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
