"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import PhoneOverlay from "@/components/PhoneOverlay";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import { sleep } from "@/lib/demo/timing";

type Step = "amount" | "source" | "review" | "processing" | "success";
type FundingSource = "checking" | "savings";

const STEP_ORDER: Step[] = ["amount", "source", "review"];

const money = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Validates a user-typed dollar amount against the funding balance.
 *  Returns an error message, or null when the amount is payable. */
function validateAmount(raw: string, available: number): string | null {
  if (raw.trim() === "") return "Enter an amount.";
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim()))
    return "Use a dollar amount like 59.99.";
  const value = parseFloat(raw);
  if (value <= 0) return "Amount must be greater than zero.";
  if (value > available)
    return `That's more than the ${money(available)} available.`;
  return null;
}

function StepDots({ step }: { step: Step }) {
  const index =
    step === "processing" || step === "success"
      ? STEP_ORDER.length
      : STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {STEP_ORDER.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= index ? "w-5 bg-orange" : "w-1.5 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function NativePaymentModal({
  payee,
  suggestedAmount,
  onClose,
}: {
  payee: string;
  suggestedAmount: number | null;
  onClose: () => void;
}) {
  const balance = useAppStore((s) => s.balance);
  const savingsBalance = useAppStore((s) => s.savingsBalance);
  const applyPayment = useAppStore((s) => s.applyPayment);
  const log = useDevLog((s) => s.log);

  const [step, setStep] = useState<Step>("amount");
  const [amountInput, setAmountInput] = useState(
    suggestedAmount !== null ? suggestedAmount.toFixed(2) : ""
  );
  const [amountError, setAmountError] = useState<string | null>(null);
  const [source, setSource] = useState<FundingSource>("checking");
  const [sourceOpen, setSourceOpen] = useState(false);

  const accounts = useMemo(
    () => ({
      checking: { label: "Citibank Checking ••3003", available: balance },
      savings: { label: "PNC Savings ••9421", available: savingsBalance },
    }),
    [balance, savingsBalance]
  );

  const amount = parseFloat(amountInput) || 0;
  const closeable = step !== "processing";

  // Escape closes the dialog (except mid-payment) — basic a11y contract
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step !== "processing") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  function handleAmountNext() {
    const error = validateAmount(amountInput, accounts[source].available);
    if (error) {
      setAmountError(error);
      return;
    }
    setAmountError(null);
    setStep("source");
  }

  async function handleSubmit() {
    setStep("processing");
    log(
      "info",
      "Transaction Engine",
      `Signing native payload · POST /internal/payments · ${money(amount)} → ${payee} · source=${source}`
    );
    await sleep(900);
    applyPayment({
      payee,
      amount,
      source,
      category: "entertainment",
    });
    log(
      "success",
      "Transaction Engine",
      "Native payload verified. Status: 200 OK. Internal balance reconciled."
    );
    const stillTracked = useAppStore
      .getState()
      .upcomingBills.some((b) => b.name === payee);
    if (!stillTracked) {
      log(
        "info",
        "Billing",
        `${payee} settled early — mandate removed from predictive timeline`
      );
    }
    await sleep(350);
    setStep("success");
  }

  return (
    <PhoneOverlay>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-[fade-slide-in_0.2s_ease-out]"
        onClick={closeable ? onClose : undefined}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pay ${payee}`}
        className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white px-5 pb-6 pt-4 shadow-2xl animate-[fade-slide-in_0.25s_ease-out]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              In-app payment
            </p>
            <h2 className="text-sm font-bold text-gray-800">{payee}</h2>
          </div>
          <div className="flex items-center gap-3">
            <StepDots step={step} />
            <button
              onClick={onClose}
              disabled={!closeable}
              aria-label="Close payment"
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {step === "amount" && (
          <div className="animate-[fade-slide-in_0.2s_ease-out]">
            <label
              htmlFor="pay-amount"
              className="text-xs font-medium text-gray-500"
            >
              Amount
            </label>
            <div className="mt-1.5 flex items-center rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-navy">
              <span className="text-lg font-semibold text-gray-400">$</span>
              <input
                id="pay-amount"
                inputMode="decimal"
                autoFocus
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setAmountError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAmountNext()}
                placeholder="0.00"
                className="ml-1 w-full bg-transparent text-lg font-semibold text-gray-800 outline-none placeholder:text-gray-300"
              />
            </div>
            {amountError && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">
                {amountError}
              </p>
            )}
            <button
              onClick={handleAmountNext}
              className="mt-4 w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "source" && (
          <div className="animate-[fade-slide-in_0.2s_ease-out]">
            <p className="text-xs font-medium text-gray-500">Pay from</p>
            <div className="relative mt-1.5">
              <button
                onClick={() => setSourceOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sourceOpen}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    {accounts[source].label}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {money(accounts[source].available)} available
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${sourceOpen ? "rotate-180" : ""}`}
                />
              </button>
              {sourceOpen && (
                <ul
                  role="listbox"
                  className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-[fade-slide-in_0.15s_ease-out]"
                >
                  {(Object.keys(accounts) as FundingSource[]).map((key) => (
                    <li key={key} role="option" aria-selected={key === source}>
                      <button
                        onClick={() => {
                          setSource(key);
                          setSourceOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50"
                      >
                        <span>
                          <span className="block text-sm font-medium text-gray-800">
                            {accounts[key].label}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {money(accounts[key].available)} available
                          </span>
                        </span>
                        {key === source && (
                          <Check size={14} className="text-orange" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep("amount")}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => {
                  const error = validateAmount(
                    amountInput,
                    accounts[source].available
                  );
                  if (error) {
                    setAmountError(error);
                    setStep("amount");
                    return;
                  }
                  setStep("review");
                }}
                className="flex-1 rounded-xl bg-navy py-3 text-sm font-semibold text-white"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="animate-[fade-slide-in_0.2s_ease-out]">
            <div className="rounded-xl bg-gray-50 p-3.5">
              {[
                ["To", payee],
                ["Amount", money(amount)],
                ["From", accounts[source].label],
                ["Fee", "$0.00"],
                ["Arrives", "Instantly"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              You stay in CampusCash the whole time — no external redirect.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setStep("source")}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white active:scale-[0.99]"
                style={{ backgroundColor: "#F26522" }}
              >
                Submit Payment
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-3 py-8 animate-[fade-slide-in_0.2s_ease-out]">
            <Loader2 size={24} className="animate-spin text-navy" />
            <p className="text-xs font-medium text-gray-500">
              Verifying payload…
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-2 py-5 animate-[fade-slide-in_0.25s_ease-out]">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <p className="text-sm font-bold text-gray-800">Payment sent</p>
            <p className="text-xs text-gray-500">
              {money(amount)} to {payee} ·{" "}
              {source === "checking"
                ? `new balance ${money(balance)}`
                : `new savings balance ${money(savingsBalance)}`}
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </PhoneOverlay>
  );
}
