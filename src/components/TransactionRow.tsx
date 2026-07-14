"use client";

import { AlertTriangle } from "lucide-react";
import type { Transaction } from "@/types";
import { formatCurrency, formatDate, CATEGORY_LABELS } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

/** The category chip cycles through the ingestion lifecycle:
 *  raw → amber warning · processing → shimmer skeleton · categorized → label
 *  + confidence. Seed transactions (no status) render the plain label. */
function CategoryChip({ txn }: { txn: Transaction }) {
  // Classifier confidence is an internal signal — only the engineering
  // demo view surfaces it; a shipped consumer app would not.
  const engineeringView = useAppStore((s) => s.viewMode) === "engineering";

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
  const needsReview =
    machineCategorized && (txn.confidence ?? 1) < 0.5;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          needsReview
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-gray-100 text-gray-500"
        } ${machineCategorized ? "animate-[fade-slide-in_0.3s_ease-out]" : ""}`}
      >
        {needsReview ? "Needs review" : CATEGORY_LABELS[txn.category]}
      </span>
      {engineeringView && machineCategorized && txn.confidence !== undefined && (
        <span
          className={`text-[10px] font-medium animate-[fade-slide-in_0.4s_ease-out] ${
            needsReview ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          {Math.round(txn.confidence * 100)}% match
        </span>
      )}
    </span>
  );
}

export default function TransactionRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.amount > 0;
  const isPending = txn.status === "raw" || txn.status === "processing";

  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-0 ${
        txn.status ? "animate-[row-flash_1.6s_ease-out]" : ""
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
