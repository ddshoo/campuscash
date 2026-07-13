/**
 * Compatibility re-export. The store now lives in useStore.ts (agentic
 * state-engine overhaul); every existing page and test keeps importing
 * `useAppStore` and the threshold sync loop stays on one source of truth.
 */
export { useStore as useAppStore } from "./useStore";
