"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import type { UpcomingBill } from "@/types";
import { formatCurrency } from "@/lib/format";
import {
  hoursUntilDue,
  isBillAtRisk,
  shortfallAmount,
  suggestedTransfer,
} from "@/lib/demo/bills";
import { sleep } from "@/lib/demo/timing";
import { useHydrated } from "@/lib/useHydrated";

function formatDueIn(bill: UpcomingBill): string {
  const hours = hoursUntilDue(bill);
  if (hours <= 0) return "due now";
  if (hours < 48) return `in ${Math.max(1, Math.round(hours))}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function DateBubble({ iso, alert }: { iso: string; alert?: boolean }) {
  const d = new Date(iso);
  return (
    <div
      className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border ${
        alert
          ? "border-amber-300 bg-amber-100 text-amber-800"
          : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <span className="text-[9px] font-semibold uppercase leading-none">
        {d.toLocaleDateString("en-US", { month: "short" })}
      </span>
      <span className="text-base font-bold leading-tight">{d.getDate()}</span>
    </div>
  );
}

function BillRow({ bill }: { bill: UpcomingBill }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 animate-[fade-slide-in_0.3s_ease-out]">
      <DateBubble iso={bill.dueDate} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{bill.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {bill.autopay && (
            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[9px] font-semibold text-blue-600">
              AUTOPAY
            </span>
          )}
          {bill.snoozed && (
            <span className="rounded-full bg-gray-100 px-1.5 py-px text-[9px] font-semibold text-gray-500">
              SNOOZED
            </span>
          )}
          <span className="text-[10px] text-gray-400">{formatDueIn(bill)}</span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-gray-700">
        {formatCurrency(bill.amount)}
      </span>
    </div>
  );
}

/** The preventive liquidity alert: an at-risk autopay charge with two
 *  in-place resolutions. Risk is derived from (bill, balance, clock), so
 *  either action clears the card by making the condition itself false. */
function AtRiskBillCard({ bill }: { bill: UpcomingBill }) {
  const balance = useAppStore((s) => s.balance);
  const savingsBalance = useAppStore((s) => s.savingsBalance);
  const transferFromSavings = useAppStore((s) => s.transferFromSavings);
  const updateBill = useAppStore((s) => s.updateBill);
  const log = useDevLog((s) => s.log);

  const [resolution, setResolution] = useState<
    "idle" | "confirming" | "processing"
  >("idle");

  const shortfall = shortfallAmount(bill, balance);
  const transferAmount = Math.min(suggestedTransfer(bill, balance), savingsBalance);
  const money = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  function handleSnooze() {
    const newDue = new Date(
      new Date(bill.dueDate).getTime() + 7 * 86_400_000
    ).toISOString();
    updateBill(bill.id, { dueDate: newDue, snoozed: true });
    log(
      "info",
      "Billing",
      `User deferred ${bill.name} by 7 days — autopay window renegotiated · risk condition cleared`
    );
  }

  async function handleConfirmTransfer() {
    setResolution("processing");
    log(
      "info",
      "Transfer Engine",
      `Initiating internal transfer: ${money(transferAmount)} PNC Savings → Citibank Checking`
    );
    await sleep(700);
    transferFromSavings(transferAmount);
    const newBalance = useAppStore.getState().balance;
    log(
      "success",
      "Transfer Engine",
      `Transfer settled · new checking balance ${money(newBalance)} · post-charge projection ${money(newBalance - bill.amount)} · risk cleared`
    );
    // No local cleanup needed: the balance change re-derives the risk flag
    // and this card unmounts in favor of the plain row.
  }

  return (
    <div
      className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-red-50 p-3 my-2 animate-[pulse-ring_2s_ease-in-out_infinite]"
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-amber-900">Overdraft risk</p>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">
              {formatDueIn(bill).toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-amber-800">
            <span className="font-semibold">{bill.name}</span> will autopay{" "}
            <span className="font-semibold">{formatCurrency(bill.amount)}</span>{" "}
            — that&apos;s {money(shortfall)} more than your current balance.
          </p>
        </div>
      </div>

      {resolution === "idle" && (
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => setResolution("confirming")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <ArrowLeftRight size={12} />
            Move Funds
          </button>
          <button
            onClick={handleSnooze}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white py-2 text-xs font-semibold text-amber-800 transition-transform active:scale-[0.98]"
          >
            <RefreshCw size={12} />
            Snooze 7 days
          </button>
        </div>
      )}

      {resolution === "confirming" && (
        <div className="mt-2.5 rounded-lg border border-gray-200 bg-white p-2.5 animate-[fade-slide-in_0.2s_ease-out]">
          <p className="text-[11px] text-gray-600">
            Transfer <span className="font-semibold">{money(transferAmount)}</span>{" "}
            from PNC Savings (••9421)?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleConfirmTransfer}
              className="flex-1 rounded-md bg-navy py-1.5 text-[11px] font-semibold text-white"
            >
              Confirm transfer
            </button>
            <button
              onClick={() => setResolution("idle")}
              className="flex-1 rounded-md border border-gray-200 py-1.5 text-[11px] font-semibold text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {resolution === "processing" && (
        <div className="mt-2.5 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5">
          <Loader2 size={13} className="animate-spin text-navy" />
          <span className="text-[11px] font-semibold text-gray-600">
            Moving {money(transferAmount)}…
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Predictive bill timeline for the home page. Renders each bill as a plain
 * row until the shortfall condition derives true, at which point that bill
 * swaps to the interactive alert card.
 */
export default function UpcomingBills() {
  // Due dates are relative to the live clock and the store is rehydrated
  // from localStorage — both would mismatch the SSR render, so wait for mount.
  const mounted = useHydrated();

  const bills = useAppStore((s) => s.upcomingBills);
  const balance = useAppStore((s) => s.balance);

  const sorted = [...bills].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const riskCount = mounted
    ? sorted.filter((b) => isBillAtRisk(b, balance)).length
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Upcoming Bills</h2>
        </div>
        {mounted && riskCount === 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <CheckCircle2 size={11} />
            On track
          </span>
        )}
        {mounted && riskCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
            <AlertTriangle size={11} />
            {riskCount} at risk
          </span>
        )}
      </div>

      {!mounted ? (
        <div className="flex flex-col gap-2 py-2">
          <div className="h-11 rounded-xl skeleton-shimmer" />
          <div className="h-11 rounded-xl skeleton-shimmer" />
        </div>
      ) : (
        sorted.map((bill) =>
          isBillAtRisk(bill, balance) ? (
            <AtRiskBillCard key={bill.id} bill={bill} />
          ) : (
            <BillRow key={bill.id} bill={bill} />
          )
        )
      )}
    </div>
  );
}
