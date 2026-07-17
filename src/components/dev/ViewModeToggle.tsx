"use client";

import { Eye } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useDevLog } from "@/store/useDevLog";
import { useHydrated } from "@/lib/useHydrated";
import type { ViewMode } from "@/types";
import { RationaleNote } from "./TriggerCard";

const MODE_META: Record<ViewMode, { label: string; routeName: string }> = {
  consumer: { label: "Consumer View", routeName: "CONSUMER" },
  engineering: { label: "Engineering View", routeName: "ENGINEERING" },
};

/**
 * Presentation switch: what a shipped user sees vs the demo's engineering
 * internals. Consumer mode hides the agent pipeline trace in the assistant
 * and the classifier match labels on transactions — same build, one flag.
 */
export default function ViewModeToggle() {
  const mounted = useHydrated();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const log = useDevLog((s) => s.log);

  function handleSwitch(mode: ViewMode) {
    if (mode === viewMode) return;
    setViewMode(mode);
    log(
      "info",
      "UI Router",
      `Surface flipped: ${MODE_META[viewMode].routeName} → ${MODE_META[mode].routeName} · agent trace ${mode === "engineering" ? "exposed" : "hidden"} · match labels ${mode === "engineering" ? "on" : "off"}`
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300">
          <Eye size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-100">
              View Mode: Consumer vs Engineering
            </h4>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[10px] text-sky-300">
              demo control
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-400">
            Consumer is exactly what a student would ship-see. Engineering
            additionally exposes the live agent pipeline in the assistant and
            classifier match labels on transactions.
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="View mode"
        className="mt-2.5 grid grid-cols-2 gap-1 rounded-md border border-slate-700 bg-slate-950 p-1"
      >
        {(Object.keys(MODE_META) as ViewMode[]).map((mode) => {
          const active = mounted && viewMode === mode;
          return (
            <button
              key={mode}
              role="radio"
              aria-checked={active}
              onClick={() => handleSwitch(mode)}
              className={`rounded py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                active
                  ? mode === "engineering"
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border border-sky-500/40 bg-sky-500/20 text-sky-300"
                  : "border border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {MODE_META[mode].label}
            </button>
          );
        })}
      </div>

      <RationaleNote
        items={[
          "One persisted store flag drives every internals surface — the demo view is the product build, not a fork.",
          "Alternative rejected: a separate ?debug build/branch — drifts from the real app and can't be flipped live mid-presentation.",
          "The agent trace is telemetry a real product would log, not render; consumer mode shows that honestly.",
        ]}
      />
    </div>
  );
}
