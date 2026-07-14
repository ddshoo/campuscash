"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight, Loader2 } from "lucide-react";

/**
 * Collapsible design-decision notes on a dev-panel card. Presentation aid:
 * every trigger carries the trade-off it demonstrates and the alternative
 * that was rejected, one click away during a deep-dive Q&A.
 */
export function RationaleNote({ items }: { items: string[] }) {
  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer select-none items-center gap-1 font-mono text-[11px] font-semibold text-slate-500 transition-colors hover:text-sky-300">
        <ChevronRight
          size={11}
          className="transition-transform group-open:rotate-90"
        />
        Design rationale
      </summary>
      <ul className="mt-1.5 flex flex-col gap-1 border-l border-slate-700 pl-2.5">
        {items.map((item) => (
          <li key={item} className="text-xs leading-snug text-slate-400">
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

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
  /** Deep-dive notes: the decision made + the alternative rejected. */
  rationale?: string[];
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
  rationale,
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
            <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[10px] text-sky-300">
              {researchTag}
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={running || disabled}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 py-2 font-mono text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500"
      >
        {running ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            {runningLabel}
          </>
        ) : (
          <>▸ {actionLabel}</>
        )}
      </button>

      {rationale && rationale.length > 0 && <RationaleNote items={rationale} />}
      {children}
    </div>
  );
}
