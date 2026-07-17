"use client";

import { RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import { useHydrated } from "@/lib/useHydrated";
import { resetChatSession } from "@/lib/chatSession";

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function SnapshotCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-xs text-slate-200">
        {value}
      </p>
    </div>
  );
}

/**
 * Live read of the same Zustand store the consumer view renders from —
 * proof for the demo that both panes share one source of truth.
 *
 * Values render as "—" until after hydration: the persisted localStorage
 * state can differ from the SSR seed values, so reading it during the first
 * client render would cause a React hydration mismatch.
 */
export default function StateSnapshot() {
  const mounted = useHydrated();

  const balance = useAppStore((s) => s.balance);
  const savingsBalance = useAppStore((s) => s.savingsBalance);
  const threshold = useAppStore((s) => s.threshold);
  const transactionCount = useAppStore((s) => s.transactions.length);
  const billCount = useAppStore((s) => s.upcomingBills.length);
  const viewMode = useAppStore((s) => s.viewMode);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const activeScenario = useDevLog((s) => s.activeScenario);
  const log = useDevLog((s) => s.log);

  function handleReset() {
    resetDemo();
    resetChatSession();
    log(
      "info",
      "Runtime",
      "Store reset to seed snapshot · localStorage[campuscash] rewritten · chat history cleared"
    );
  }

  const show = (value: string) => (mounted ? value : "—");

  return (
    <div>
      <h3 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Store Snapshot
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        <SnapshotCell label="Checking" value={show(formatMoney(balance))} />
        <SnapshotCell label="Savings" value={show(formatMoney(savingsBalance))} />
        <SnapshotCell
          label="Threshold"
          value={show(formatMoney(threshold))}
        />
        <SnapshotCell
          label="Transactions"
          value={show(String(transactionCount))}
        />
        <SnapshotCell label="Bills" value={show(String(billCount))} />
        <SnapshotCell label="View" value={show(viewMode)} />
        <SnapshotCell
          label="Scenario"
          value={show(activeScenario ?? "none")}
        />
      </div>
      <button
        onClick={handleReset}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 py-1.5 font-mono text-[11px] font-semibold text-red-300/90 transition-colors hover:bg-red-500/15"
      >
        <RotateCcw size={12} />
        Reset demo state
      </button>
    </div>
  );
}
