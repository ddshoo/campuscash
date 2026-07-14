"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

type TriggerCardProps = {
  icon: LucideIcon;
  title: string;
  /** Ties the trigger back to the user-research finding it demonstrates. */
  researchTag: string;
  description: string;
  actionLabel: string;
  runningLabel: string;
  onRun: () => void;
  running: boolean;
  /** True while some OTHER scenario is mid-flight — locks this trigger. */
  disabled?: boolean;
  children?: React.ReactNode;
};

/**
 * One scenario trigger in the dev panel. `children` renders below the action
 * button for triggers that carry extra controls (e.g. the architecture toggle).
 */
export default function TriggerCard({
  icon: Icon,
  title,
  researchTag,
  description,
  actionLabel,
  runningLabel,
  onRun,
  running,
  disabled = false,
  children,
}: TriggerCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-100">{title}</h4>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[9px] text-sky-300">
              {researchTag}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={running || disabled}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 py-1.5 font-mono text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500"
      >
        {running ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            {runningLabel}
          </>
        ) : (
          <>▸ {actionLabel}</>
        )}
      </button>

      {children}
    </div>
  );
}
