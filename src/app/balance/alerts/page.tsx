"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="#0D3B66"
      strokeWidth={2.5}
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        on ? "bg-navy" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function BalanceAlertsPage() {
  const router = useRouter();
  const balance = useAppStore((s) => s.balance);
  const threshold = useAppStore((s) => s.threshold);
  const profile = useAppStore((s) => s.profile);
  const setThreshold = useAppStore((s) => s.setThreshold);

  const [accordionOpen, setAccordionOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(threshold));
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [textOn, setTextOn] = useState(false);

  function handleDone() {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setThreshold(parsed);
    }
    router.push("/balance");
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/balance"
              aria-label="Back to balance"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
            >
              <BackIcon />
            </Link>
            <h1 className="text-white text-xl font-bold">Balance Alerts</h1>
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
        {/* Bank card */}
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

        {/* What is a Balance Alert? accordion */}
        <div className="bg-white rounded-2xl shadow-sm px-4">
          <button
            onClick={() => setAccordionOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4"
          >
            <span className="text-sm font-semibold text-gray-800">
              What is a Balance Alert?
            </span>
            <ChevronIcon open={accordionOpen} />
          </button>
          {accordionOpen && (
            <p className="text-sm text-gray-500 pb-4 leading-relaxed">
              A balance alert notifies you when your account balance falls at or
              below a threshold you set — so you always know before you overdraft.
            </p>
          )}
        </div>

        {/* Low Balance Threshold card */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Low Balance Threshold
          </h2>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Edit or add a low balance threshold and you&apos;ll be alerted when
            you&apos;re at or below the threshold.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#0D3B66" } as React.CSSProperties}
              />
            </div>
            <button
              onClick={handleDone}
              className="bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Done
            </button>
          </div>
        </div>

        {/* Alerts Delivery card */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Alerts Delivery
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Push Notifications
                </p>
                <p className="text-xs text-gray-400">Via this app</p>
              </div>
              <Toggle on={pushOn} onToggle={() => setPushOn((v) => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Email</p>
                <p className="text-xs text-gray-400">alex@umich.edu</p>
              </div>
              <Toggle on={emailOn} onToggle={() => setEmailOn((v) => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Text Message</p>
                <p className="text-xs text-gray-400">+1 (734) 555-0192</p>
              </div>
              <Toggle on={textOn} onToggle={() => setTextOn((v) => !v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
