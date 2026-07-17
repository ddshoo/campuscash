"use client";

import { AlertTriangle } from "lucide-react";
import type { Transaction } from "@/types";
import { formatCurrency, formatDate, CATEGORY_LABELS } from "@/lib/format";
import { matchLabel } from "@/lib/demo/categorizer";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";

/** The category chip cycles through the ingestion lifecycle:
 *  raw → amber warning · processing → shimmer skeleton · categorized → label
 *  + match explanation. Seed transactions (no status) render the plain label. */
function CategoryChip({ txn }: { txn: Transaction }) {
  // The classifier's rule trail is an internal signal — only the engineering
  // demo view surfaces it; a shipped consumer app would not.
  const engineeringView = useAppStore((s) => s.viewMode) === "engineering";
  // Mount animations only while the pipeline is running (see TransactionRow).
  const scenarioLive = useDevLog((s) => s.activeScenario !== null);

  if (txn.status === "raw") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full animate-[fade-slide-in_0.3s_ease-out]">
        <AlertTriangle size={9} />
        Uncategorized
      </span>
    );
  }

  if (txn.status === "processing") {
    return (
      <span className="inline-block w-20 h-[18px] rounded-full skeleton-shimmer" />
    );
  }

  const machineCategorized = txn.status === "categorized";
  const needsReview = machineCategorized && txn.match === "none";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          needsReview
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-gray-100 text-gray-500"
        } ${machineCategorized && scenarioLive ? "animate-[fade-slide-in_0.3s_ease-out]" : ""}`}
      >
        {needsReview ? "Needs review" : CATEGORY_LABELS[txn.category]}
      </span>
      {/* Explainable rule trail: which tier fired and on what token —
          honest about being rules, no pseudo-statistical percentages */}
      {engineeringView && machineCategorized && txn.match && txn.match !== "none" && (
        <span
          className={`text-[10px] font-medium text-emerald-600 ${
            scenarioLive ? "animate-[fade-slide-in_0.4s_ease-out]" : ""
          }`}
        >
          {matchLabel({ match: txn.match, matchedToken: txn.matchedToken ?? null })}
        </span>
      )}
    </span>
  );
}

export default function TransactionRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.amount > 0;
  const isPending = txn.status === "raw" || txn.status === "processing";
  // `status` persists to localStorage, but the flash should mark *freshly
  // injected* rows only — gate it on the transient scenario flag so rows
  // don't re-flash on every page mount after the pipeline has finished.
  const scenarioLive = useDevLog((s) => s.activeScenario !== null);

  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-0 ${
        txn.status && scenarioLive ? "animate-[row-flash_1.6s_ease-out]" : ""
      }`}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={`text-sm truncate transition-opacity duration-300 ${
            isPending
              ? "font-mono text-[12px] text-gray-500"
              : "font-medium text-gray-800"
          }`}
        >
          {txn.description}
        </span>
        <div className="flex items-center gap-2">
          <CategoryChip txn={txn} />
          <span className="text-[11px] text-gray-400">
            {formatDate(txn.date)}
          </span>
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
