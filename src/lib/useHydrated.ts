import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * False during SSR and the hydration render, true immediately after.
 *
 * Components that read persisted-store values or the live clock use this to
 * defer to a skeleton until the client takes over — rendering those values
 * during hydration would mismatch the server HTML. Built on
 * useSyncExternalStore instead of the classic `useEffect(setMounted)` flag,
 * which the react-hooks lint rules now reject (setState-in-effect cascades).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot: hydration is done by the time this runs
    () => false // server snapshot
  );
}
