"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { ThresholdBanner } from "@/components/ThresholdBanner";
import TransactionRow from "@/components/TransactionRow";
import UpcomingBills from "@/components/UpcomingBills";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

export default function HomePage() {
  const balance = useAppStore((s) => s.balance);
  const threshold = useAppStore((s) => s.threshold);
  const transactions = useAppStore((s) => s.transactions);
  const profile = useAppStore((s) => s.profile);

  const recent = transactions.slice(0, 5);

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
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <BellIcon />
          </Link>
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
        <ThresholdBanner balance={balance} threshold={threshold} />

        {/* Predictive bill timeline (shortfall alerts surface here) */}
        <UpcomingBills />

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

        {/* AI Assistant entry point */}
        <Link href="/assistant">
          <div className="rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm" style={{ backgroundColor: "#0D3B66" }}>
            <div>
              <p className="text-white text-sm font-semibold">Ask CampusCash AI</p>
              <p className="text-blue-200 text-xs mt-0.5">Get answers about your finances</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
