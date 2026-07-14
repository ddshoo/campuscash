/** Artificial latency for demo scenarios — makes the log stream feel like a
 *  real network/pipeline instead of an instant state dump. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
