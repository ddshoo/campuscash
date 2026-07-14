import { useStore } from "@/store/useStore";
import { useDevLog } from "@/store/useDevLog";
import { sleep } from "@/lib/demo/timing";
import { RISK_WINDOW_HOURS } from "@/lib/demo/bills";

const SHORTFALL_BALANCE = 34.5;
const BILL_NAME = "StreamPlus Premium";
const BILL_AMOUNT = 59.99;

const money = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * "Simulate Balance Shortfall & Bill" — Feature B.
 *
 * Forces the irregular-income gap the original user research surfaced:
 * checking drops to $34.50 while a $59.99 autopay renewal sits 48h out.
 * The alert itself is DERIVED state (see lib/demo/bills.ts) — this scenario
 * only sets up the conditions; the home timeline reacts on its own.
 *
 * Idempotent on re-runs: the balance override reapplies, but a second
 * StreamPlus mandate is never registered twice.
 */
export async function runShortfallScenario(): Promise<void> {
  const devLog = useDevLog.getState();
  if (devLog.activeScenario) return;
  devLog.setActiveScenario("shortfall");
  const { log } = devLog;

  try {
    const store = useStore.getState();
    const previousBalance = store.balance;

    log(
      "info",
      "Ledger",
      `Balance override applied: ${money(previousBalance)} → ${money(SHORTFALL_BALANCE)} (simulating gap before next work-study deposit)`
    );
    store.overrideBalance(SHORTFALL_BALANCE);
    await sleep(650);

    const existing = useStore
      .getState()
      .upcomingBills.find((b) => b.name === BILL_NAME);
    if (existing) {
      log(
        "info",
        "Billing",
        `Autopay mandate for ${BILL_NAME} already registered — skipping duplicate enrollment`
      );
    } else {
      useStore.getState().addBill({
        id: `bill_streamplus_${Date.now()}`,
        name: BILL_NAME,
        amount: BILL_AMOUNT,
        dueDate: new Date(Date.now() + 48 * 3_600_000).toISOString(),
        autopay: true,
        fundingSource: "Citibank Checking ••3003",
      });
      log(
        "info",
        "Billing",
        `Autopay mandate registered: ${BILL_NAME} · ${money(BILL_AMOUNT)} · executes in 48h`
      );
    }
    await sleep(700);

    log(
      "warn",
      "Shortfall Engine",
      `Scanning predictive timeline (${RISK_WINDOW_HOURS}h window)… Balance (${money(SHORTFALL_BALANCE)}) < Upcoming Charge (${money(BILL_AMOUNT)}). Overdraft risk detected.`
    );
    await sleep(500);
    log(
      "warn",
      "Shortfall Engine",
      "Injecting preventive liquidity alert → surface: home/upcoming-bills · resolutions: [snooze, transfer]"
    );
  } finally {
    useDevLog.getState().setActiveScenario(null);
  }
}
