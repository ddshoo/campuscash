import type { Transaction } from "@/types";
import { useStore } from "@/store/useStore";
import { useDevLog } from "@/store/useDevLog";
import { sleep } from "@/lib/demo/timing";
import {
  buildRawVendorDump,
  parseDescriptor,
  classifyMerchant,
  REVIEW_QUEUE_THRESHOLD,
} from "@/lib/demo/categorizer";

/** Monotonic batch counter so repeated demo runs read like a real feed. */
let batchNumber = 0;

/**
 * "Simulate Raw Transaction Dump" — Feature A.
 *
 * Orchestrates the full pipeline against the live store with artificial
 * latency between stages, so the consumer view visibly transitions:
 * raw (uncategorized warning) → processing (shimmer) → categorized (chips +
 * confidence). The dev-log narrates every operation the engine performs.
 *
 * Runs client-side only (dev-panel trigger); guarded against double-fire.
 */
export async function runRawDumpScenario(): Promise<void> {
  const devLog = useDevLog.getState();
  if (devLog.activeScenario) return;
  devLog.setActiveScenario("raw-dump");
  const { log } = devLog;

  try {
    const payloads = buildRawVendorDump();
    batchNumber += 1;
    const batchId = `${String(batchNumber).padStart(2, "0")}f${(7331 + batchNumber * 17).toString(16)}`;

    log(
      "info",
      "Ingest",
      `Provider feed connected — pulling raw transaction dump (batch ${batchId})`
    );
    await sleep(500);

    // Land the payloads in the store untouched: descriptors verbatim,
    // category parked at "other", status "raw". This is the moment the
    // consumer view falls into its uncategorized warning state.
    const stamp = Date.now();
    const rawTransactions: Transaction[] = payloads.map((p, i) => ({
      id: `txn_raw_${stamp}_${i}`,
      date: p.date,
      description: p.descriptor,
      category: "other",
      amount: p.amount,
      status: "raw",
      rawDescriptor: p.descriptor,
    }));
    useStore.getState().ingestTransactions(rawTransactions);

    log(
      "info",
      "Ingest",
      `Received ${payloads.length} unstructured payloads · schema=proc-descriptor/v1 · 0 categorized`
    );
    await sleep(650);
    log("info", "Parser", "Normalization pass started — stripping processor noise");
    await sleep(400);

    let confidenceSum = 0;
    let reviewQueueCount = 0;

    for (const txn of rawTransactions) {
      useStore.getState().updateTransaction(txn.id, { status: "processing" });

      const parsed = parseDescriptor(txn.rawDescriptor!);
      await sleep(340);
      log(
        "info",
        "Parser",
        `"${txn.rawDescriptor}" → "${parsed.merchant}" (${parsed.steps.map((s) => s.op).join(" · ")})`
      );

      const result = classifyMerchant(parsed.merchant);
      confidenceSum += result.confidence;
      await sleep(300);

      if (result.matchedToken && result.confidence >= REVIEW_QUEUE_THRESHOLD) {
        log(
          "info",
          "Classifier",
          `token "${result.matchedToken}" → ${result.category.toUpperCase()} · w=${result.confidence.toFixed(2)}`
        );
      } else {
        reviewQueueCount += 1;
        log(
          "warn",
          "Classifier",
          `no rule matched "${parsed.merchant}" · w=${result.confidence.toFixed(2)} — routed to review queue as OTHER`
        );
      }

      useStore.getState().updateTransaction(txn.id, {
        description: parsed.merchant,
        category: result.category,
        confidence: result.confidence,
        status: "categorized",
      });
    }

    await sleep(450);
    const avgConfidence = confidenceSum / payloads.length;
    log(
      "success",
      "Classifier",
      `${payloads.length}/${payloads.length} payloads mapped · avg confidence ${avgConfidence.toFixed(2)} · ${reviewQueueCount} flagged for review`
    );
    await sleep(250);
    log(
      "success",
      "Ledger",
      `Spending model rebuilt — balance reconciled to ${useStore
        .getState()
        .balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}`
    );
  } finally {
    useDevLog.getState().setActiveScenario(null);
  }
}
