"use client";

import { CalendarClock, DatabaseZap } from "lucide-react";
import TriggerCard from "./TriggerCard";
import ArchitectureToggle from "./ArchitectureToggle";
import ViewModeToggle from "./ViewModeToggle";
import ManualOverrides from "./ManualOverrides";
import { useDevLog } from "@/store/useDevLog";
import { runRawDumpScenario } from "@/lib/demo/scenarios/rawDump";
import { runShortfallScenario } from "@/lib/demo/scenarios/shortfall";

export default function ScenarioTriggers() {
  const activeScenario = useDevLog((s) => s.activeScenario);

  return (
    <section className="shrink-0">
      <h3 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Scenario Triggers
      </h3>
      <div className="flex flex-col gap-2">
        <ViewModeToggle />
        <TriggerCard
          icon={DatabaseZap}
          title="Simulate Raw Transaction Dump"
          researchTag="P1 · dead filters"
          description="Injects 7 unparsed processor payloads, then streams the normalize → classify pipeline until the spending view segments itself."
          actionLabel="Run ingestion pipeline"
          runningLabel="Pipeline executing…"
          onRun={runRawDumpScenario}
          running={activeScenario === "raw-dump"}
          disabled={activeScenario !== null && activeScenario !== "raw-dump"}
          rationale={[
            "Rule-based classifier, not an LLM call: deterministic, auditable, zero latency/cost per transaction — the right tool for regular descriptor formats.",
            "Unknown merchants route to a low-confidence review queue instead of guessing; an LLM would be the escalation path for exactly that queue.",
            "Research tie-in: category filters were \"dead\" because data arrived unclassified — the pipeline is what makes filters mean something.",
          ]}
        />
        <TriggerCard
          icon={CalendarClock}
          title="Simulate Balance Shortfall & Bill"
          researchTag="P2 · overdraft panic"
          description="Drops checking to $34.50 and registers a $59.99 autopay renewal 48h out — the shortfall engine derives the risk and raises a preventive alert on Home."
          actionLabel="Trigger shortfall scan"
          runningLabel="Scanning timeline…"
          onRun={runShortfallScenario}
          running={activeScenario === "shortfall"}
          disabled={activeScenario !== null && activeScenario !== "shortfall"}
          rationale={[
            "Risk is DERIVED — a pure function of (bill, balance, clock). No stored alert flag to desync, the same bug class as the original threshold-sync issue.",
            "Move Funds and Snooze never touch an alert: they change the balance or the due date, and the condition re-derives to false.",
            "Alternative rejected: persisting an at-risk flag per bill — every resolution path would need cleanup bookkeeping.",
          ]}
        />
        <ArchitectureToggle />
        <ManualOverrides />
      </div>
    </section>
  );
}
