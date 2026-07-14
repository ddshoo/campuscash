import { create } from "zustand";

export type LogLevel = "info" | "warn" | "success";

export type DevLogEntry = {
  id: number;
  ts: number;
  level: LogLevel;
  engine: string;
  message: string;
};

/** Long-running demo scenarios. Used to lock triggers while one is mid-flight. */
export type ScenarioId = "raw-dump" | "shortfall";

type DevLogState = {
  entries: DevLogEntry[];
  /** Guards the one-time boot sequence (StrictMode double-mounts effects). */
  booted: boolean;
  activeScenario: ScenarioId | null;

  log: (level: LogLevel, engine: string, message: string) => void;
  markBooted: () => void;
  setActiveScenario: (scenario: ScenarioId | null) => void;
  clear: () => void;
};

/** Ring-buffer cap so a long demo session never grows the array unbounded. */
const MAX_ENTRIES = 250;

let nextId = 1;

/**
 * Deliberately NOT persisted (unlike useStore): replaying yesterday's log
 * stream after a reload would misrepresent what the engines actually did —
 * same reasoning as the transient routingState in the main store.
 */
export const useDevLog = create<DevLogState>((set) => ({
  entries: [],
  booted: false,
  activeScenario: null,

  log: (level, engine, message) =>
    set((state) => ({
      entries: [
        ...state.entries,
        { id: nextId++, ts: Date.now(), level, engine, message },
      ].slice(-MAX_ENTRIES),
    })),
  markBooted: () => set({ booted: true }),
  setActiveScenario: (activeScenario) => set({ activeScenario }),
  clear: () => set({ entries: [] }),
}));
