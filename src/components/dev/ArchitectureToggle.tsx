"use client";

import { ArrowLeftRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import { useHydrated } from "@/lib/useHydrated";
import type { PaymentArchitecture } from "@/types";

const MODE_META: Record<
  PaymentArchitecture,
  { label: string; flag: string; routeName: string }
> = {
  legacy: {
    label: "Legacy External",
    flag: "payments.native=false",
    routeName: "LEGACY_EXTERNAL",
  },
  native: {
    label: "Native In-App",
    flag: "payments.native=true",
    routeName: "NATIVE_INAPP",
  },
};

/**
 * Feature C's structural toggle: hot-swaps the checkout engine by writing a
 * single store field. The Balance page re-renders its entire payment surface
 * off that field — no other coordination.
 */
export default function ArchitectureToggle() {
  const mounted = useHydrated();

  const architecture = useAppStore((s) => s.paymentArchitecture);
  const setPaymentArchitecture = useAppStore((s) => s.setPaymentArchitecture);
  const log = useDevLog((s) => s.log);

  function handleSwitch(mode: PaymentArchitecture) {
    if (mode === architecture) return;
    setPaymentArchitecture(mode);
    log(
      "info",
      "Checkout Router",
      `Checkout engine hot-swapped: ${MODE_META[architecture].routeName} → ${MODE_META[mode].routeName} · flag ${MODE_META[mode].flag}`
    );
    if (mode === "legacy") {
      log(
        "warn",
        "Checkout Router",
        "Legacy route reinstated — expect external-handoff friction on balance/payments"
      );
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300">
          <ArrowLeftRight size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-100">
              Toggle Architecture: Checkout Engine
            </h4>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[9px] text-sky-300">
              P3 · banner friction
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">
            Structurally swaps the Balance page&apos;s payment surface between
            the drop-off-prone external redirect and the rebuilt in-app flow.
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Checkout engine"
        className="mt-2.5 grid grid-cols-2 gap-1 rounded-md border border-slate-700 bg-slate-950 p-1"
      >
        {(Object.keys(MODE_META) as PaymentArchitecture[]).map((mode) => {
          const active = mounted && architecture === mode;
          return (
            <button
              key={mode}
              role="radio"
              aria-checked={active}
              onClick={() => handleSwitch(mode)}
              className={`rounded py-1.5 font-mono text-[10px] font-semibold transition-colors ${
                active
                  ? mode === "native"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "border border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {MODE_META[mode].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
