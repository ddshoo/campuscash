"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

export default function NotificationsPage() {
  const balance = useAppStore((s) => s.balance);
  const threshold = useAppStore((s) => s.threshold);
  const profile = useAppStore((s) => s.profile);

  const isBelowThreshold = balance < threshold;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <BackIcon />
          </Link>
          <h1 className="text-white text-xl font-bold">Notifications</h1>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        {isBelowThreshold ? (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            {/* Alert dot + label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-orange shrink-0" style={{ backgroundColor: "#F26522" }} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Low Balance Alert
              </span>
            </div>

            <p className="text-sm font-medium text-gray-800 leading-snug">
              Account ending in {profile.accountLast4} is below the Low Balance
              Threshold
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your balance of{" "}
              <span className="font-semibold text-gray-600">
                {balance.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>{" "}
              is below your alert threshold of{" "}
              <span className="font-semibold text-gray-600">
                {threshold.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>
              .
            </p>

            <div className="flex gap-2 mt-4">
              <Link
                href="/transactions"
                className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white"
                style={{ backgroundColor: "#0D3B66" }}
              >
                View History
              </Link>
              <Link
                href="/balance/alerts"
                className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white"
              >
                Edit Alert
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg viewBox="0 0 24 24" width={40} height={40} fill="#D1D5DB">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <p className="text-sm font-semibold text-gray-400">No New Notifications</p>
            <p className="text-xs text-gray-300">You&apos;re all caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
