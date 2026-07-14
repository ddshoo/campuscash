"use client";

import { useEffect, useState } from "react";
import { PanelRightClose, PanelRightOpen, TerminalSquare } from "lucide-react";
import { useDevLog } from "@/store/useDevLog";
import SystemLog from "./SystemLog";
import StateSnapshot from "./StateSnapshot";
import ScenarioTriggers from "./ScenarioTriggers";

/**
 * "God Mode" console docked beside the phone frame on lg+ screens.
 * Everything it shows and mutates goes through the same Zustand stores the
 * consumer view uses — the panel has no private state about the app.
 */
export default function DevPanel() {
  const [open, setOpen] = useState(true);

  // One-time boot sequence. Guarded by `booted` so React StrictMode's
  // double-invoked effects (and panel collapse/expand) don't duplicate it.
  useEffect(() => {
    const { booted, markBooted, log } = useDevLog.getState();
    if (booted) return;
    markBooted();
    log("info", "Runtime", "Demo harness attached · build 0.4.2 · env=preview");
    log(
      "info",
      "State Bridge",
      "zustand@5 store bridged · persistence: localStorage[campuscash]"
    );
    log(
      "success",
      "Runtime",
      "Scenario modules registered: categorizer · shortfall-engine · checkout-router"
    );
  }, []);

  if (!open) {
    return (
      <aside className="hidden lg:flex h-full w-12 shrink-0 flex-col items-center border-l border-slate-800 bg-slate-950 py-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open dev panel"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-emerald-300"
        >
          <PanelRightOpen size={18} />
        </button>
        <span
          className="mt-4 font-mono text-[10px] font-semibold tracking-[0.2em] text-slate-600"
          style={{ writingMode: "vertical-rl" }}
        >
          DEVTOOLS
        </span>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex h-full w-[440px] xl:w-[500px] shrink-0 flex-col border-l border-slate-800 bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <TerminalSquare size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-100">
                CampusCash DevTools
              </h2>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-px font-mono text-[9px] font-semibold text-amber-300">
                DEMO ENV
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-500">
              internal console · build 0.4.2 · env=preview
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Collapse dev panel"
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <PanelRightClose size={16} />
        </button>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <ScenarioTriggers />
        <SystemLog />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 p-4">
        <StateSnapshot />
      </footer>
    </aside>
  );
}
