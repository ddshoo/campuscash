"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import type { Transaction, TransactionCategory } from "@/types";

const CATEGORIES: TransactionCategory[] = [
  "food",
  "transport",
  "entertainment",
  "shopping",
  "income",
  "rent",
  "utilities",
  "tuition",
  "other",
];

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none";

const buttonClass =
  "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500";

/**
 * Free-form state controls for live Q&A: set the checking balance to any
 * value and inject arbitrary transactions on the spot, so "what would the
 * assistant say if…" questions can be answered without a canned scenario.
 * Writes go through the same store actions the scenarios use — the panel
 * still holds no private app state.
 */
export default function ManualOverrides() {
  const balance = useAppStore((s) => s.balance);
  const log = useDevLog((s) => s.log);

  // ── Balance override ──
  const [balanceInput, setBalanceInput] = useState("");

  function applyBalance() {
    const value = Number(balanceInput);
    if (!balanceInput.trim() || Number.isNaN(value)) return;
    useAppStore.getState().overrideBalance(value);
    log(
      "success",
      "State Bridge",
      `manual override: checking balance → $${value.toFixed(2)}`
    );
    setBalanceInput("");
  }

  // ── Custom transaction ──
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"debit" | "credit">("debit");
  const [category, setCategory] = useState<TransactionCategory>("other");

  function addTransaction() {
    const magnitude = Number(amount);
    if (!desc.trim() || !amount.trim() || Number.isNaN(magnitude) || magnitude <= 0)
      return;
    const signed = direction === "debit" ? -magnitude : magnitude;
    const tx: Transaction = {
      id: `txn_manual_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: desc.trim(),
      category,
      amount: signed,
    };
    // ingestTransactions also reconciles the balance, same as the pipeline
    useAppStore.getState().ingestTransactions([tx]);
    log(
      "success",
      "State Bridge",
      `manual transaction: ${direction === "debit" ? "-" : "+"}$${magnitude.toFixed(
        2
      )} "${tx.description}" (${category})`
    );
    setDesc("");
    setAmount("");
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300">
          <SlidersHorizontal size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-100">
              Manual State Overrides
            </h4>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[10px] text-sky-300">
              live Q&A
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-400">
            Set any balance or inject a custom transaction — the assistant and
            shortfall engine re-derive from whatever state you put here.
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="mt-3">
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Checking balance · currently ${balance.toFixed(2)}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyBalance()}
            placeholder="e.g. 34.50"
            className={inputClass}
          />
          <button
            onClick={applyBalance}
            disabled={!balanceInput.trim()}
            className={buttonClass}
          >
            Set
          </button>
        </div>
      </div>

      {/* Transaction */}
      <div className="mt-3">
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Add transaction
        </p>
        <div className="flex flex-col gap-2">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description — e.g. Spotify Premium"
            className={inputClass}
          />
          <div className="flex gap-2">
            <select
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "debit" | "credit")
              }
              className={inputClass}
            >
              <option value="debit">Debit (−)</option>
              <option value="credit">Credit (+)</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as TransactionCategory)
              }
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={addTransaction}
              disabled={!desc.trim() || !amount.trim()}
              className={buttonClass}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
