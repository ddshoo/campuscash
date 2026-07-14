"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/lib/useHydrated";
import LegacyExternalBanner from "./LegacyExternalBanner";
import NativePaymentModal from "./NativePaymentModal";

/**
 * The checkout surface on the Balance page. Which engine renders here is a
 * single store field (`paymentArchitecture`) — the dev-panel toggle swaps the
 * entire flow, which is the point of Feature C's before/after demo.
 */
export default function PaymentSection() {
  // paymentArchitecture is persisted; wait for hydration before choosing a
  // branch or SSR markup could mismatch the client's stored value.
  const mounted = useHydrated();

  const architecture = useAppStore((s) => s.paymentArchitecture);
  const upcomingBills = useAppStore((s) => s.upcomingBills);
  const [paying, setPaying] = useState(false);

  if (!mounted) {
    return <div className="mx-4 h-[104px] rounded-2xl skeleton-shimmer" />;
  }

  if (architecture === "legacy") {
    return (
      <div className="mx-4">
        <LegacyExternalBanner />
      </div>
    );
  }

  // Native mode pre-fills the most urgent tracked autopay bill, if any
  const nextBill =
    [...upcomingBills].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0] ?? null;
  const payee = nextBill?.name ?? "U-M Student Account";
  const suggestedAmount = nextBill?.amount ?? null;

  return (
    <div className="mx-4 rounded-2xl bg-white px-4 py-4 shadow-sm animate-[fade-slide-in_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Payments</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
            <ShieldCheck size={11} className="text-emerald-500" />
            In-app checkout — no redirects
          </p>
        </div>
        <button
          onClick={() => setPaying(true)}
          className="rounded-xl px-4 py-2.5 text-xs font-bold text-white active:scale-[0.98]"
          style={{ backgroundColor: "#F26522" }}
        >
          Make a Payment
        </button>
      </div>

      {paying && (
        <NativePaymentModal
          payee={payee}
          suggestedAmount={suggestedAmount}
          onClose={() => setPaying(false)}
        />
      )}
    </div>
  );
}
