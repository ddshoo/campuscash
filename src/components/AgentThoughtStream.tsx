"use client";

import type { AgentTraceData, AgentTraceLevel } from "@/types";

// Credit Karma system flags
const LEVEL_COLORS: Record<AgentTraceLevel, string> = {
  routine: "#00C07B", // mint — optimized utility path
  deep: "#FF9500", // amber — deep-reasoning compute shift
  correction: "#FF3B30", // crimson — self-correction loop
};

const LEVEL_LABELS: Record<AgentTraceLevel, string> = {
  routine: "Optimized",
  deep: "Deep Reasoning",
  correction: "Self-Correcting",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type Props = {
  events: AgentTraceData[];
  /** True while the pipeline is still streaming — keeps the dot blinking. */
  live: boolean;
};

export function AgentThoughtStream({ events, live }: Props) {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  // Idle final event settles to mint; otherwise color tracks the latest stage.
  const dotColor = LEVEL_COLORS[latest.level];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            {live && (
              <span
                className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60"
                style={{ backgroundColor: dotColor }}
              />
            )}
            <span
              className="relative inline-flex w-2 h-2 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase text-[#1A2B4C]">
            Agent Pipeline
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: dotColor, backgroundColor: `${dotColor}14` }}
        >
          {live ? LEVEL_LABELS[latest.level] : "Complete"}
        </span>
      </div>

      {/* Ledger */}
      <div className="px-4 py-2 bg-[#F8F9FA]">
        <ol className="flex flex-col">
          {events.map((event, i) => {
            const color = LEVEL_COLORS[event.level];
            const isLast = i === events.length - 1;
            return (
              <li key={`${event.ts}-${i}`} className="flex gap-2.5">
                {/* Rail */}
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {!isLast && <span className="w-px flex-1 bg-gray-200" />}
                </div>
                {/* Entry */}
                <div className={`min-w-0 pb-2 ${isLast ? "" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    <p className="text-[11px] font-mono leading-4 text-[#1A2B4C] break-words">
                      {event.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#6F7D95]">
                      {formatTime(event.ts)}
                    </span>
                    {event.model && (
                      <span className="text-[10px] font-medium text-[#6F7D95] bg-white border border-gray-100 px-1.5 rounded">
                        {event.model}
                      </span>
                    )}
                    {typeof event.tokensIn === "number" && (
                      <span className="text-[10px] text-[#6F7D95]">
                        ~{event.tokensIn} tok
                      </span>
                    )}
                  </div>
                  {event.detail && (
                    <p className="text-[10px] text-[#6F7D95] mt-0.5 break-words">
                      {event.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
