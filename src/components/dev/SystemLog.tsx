"use client";

import { useEffect, useRef } from "react";
import { Eraser, TerminalSquare } from "lucide-react";
import { useDevLog, type DevLogEntry, type LogLevel } from "@/store/useDevLog";

const LEVEL_STYLES: Record<
  LogLevel,
  { badge: string; text: string; label: string }
> = {
  info: {
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    text: "text-slate-300",
    label: "INFO",
  },
  warn: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    text: "text-amber-200",
    label: "WARN",
  },
  success: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    text: "text-emerald-200",
    label: "SUCCESS",
  },
};

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function LogLine({ entry }: { entry: DevLogEntry }) {
  const style = LEVEL_STYLES[entry.level];
  return (
    <div className="px-3 py-1 font-mono text-xs leading-relaxed animate-[log-line-in_0.25s_ease-out] hover:bg-white/[0.03]">
      <span className="text-slate-600">{formatTimestamp(entry.ts)}</span>{" "}
      <span
        className={`inline-block w-[68px] text-center border rounded px-1 text-[10px] font-semibold tracking-wide align-[1px] ${style.badge}`}
      >
        {style.label}
      </span>{" "}
      <span className="text-slate-500">[{entry.engine}]</span>{" "}
      <span className={style.text}>{entry.message}</span>
    </div>
  );
}

/**
 * Auto-scrolling terminal feed. Follows the tail only while the user is
 * already near the bottom — scrolling up to read history never gets yanked
 * back down by a new entry.
 */
export default function SystemLog() {
  const entries = useDevLog((s) => s.entries);
  const clear = useDevLog((s) => s.clear);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToTail = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedToTail.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToTail.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
          System Log
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-600">
            {entries.length} events
          </span>
          <button
            onClick={clear}
            aria-label="Clear log"
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <Eraser size={13} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-slate-800 bg-black/50 py-1.5"
      >
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-600">
            <TerminalSquare size={20} />
            <p className="font-mono text-xs">
              log stream idle — run a scenario trigger
            </p>
          </div>
        ) : (
          entries.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
