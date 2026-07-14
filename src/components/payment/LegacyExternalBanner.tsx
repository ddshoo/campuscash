"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Globe, Loader2, TriangleAlert } from "lucide-react";
import PhoneOverlay from "@/components/PhoneOverlay";
import { useDevLog } from "@/store/useDevLog";

/**
 * The "before" state Feature C demonstrates: a third-party marketing banner
 * that yanks the user out of the app to pay. Deliberately clashes with the
 * design system — that jarring quality IS the research finding (drop-off at
 * the external handoff).
 */
export default function LegacyExternalBanner() {
  const log = useDevLog((s) => s.log);
  const [phase, setPhase] = useState<"idle" | "redirecting" | "external">(
    "idle"
  );

  function handleRedirect() {
    setPhase("redirecting");
    log(
      "warn",
      "Checkout Router",
      "LEGACY route: external handoff initiated → payportal-secure-payments.example.com"
    );
  }

  // Simulated handoff latency before the "external site" appears
  useEffect(() => {
    if (phase !== "redirecting") return;
    const timer = setTimeout(() => {
      setPhase("external");
      useDevLog
        .getState()
        .log(
          "warn",
          "Checkout Router",
          "Session context dropped at app boundary · historical funnel drop-off at this step: 38%"
        );
    }, 1400);
    return () => clearTimeout(timer);
  }, [phase]);

  function handleReturn() {
    setPhase("idle");
    log(
      "info",
      "Checkout Router",
      "User returned without completing payment · funnel exit recorded"
    );
  }

  return (
    <>
      <div className="rounded-lg border-2 border-dashed border-fuchsia-400 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 p-4 animate-[fade-slide-in_0.3s_ease-out]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">
          Advertisement · Partner offer
        </p>
        <p className="mt-1 text-base font-black uppercase italic leading-tight text-white">
          Pay your bills with PayPortal™!!
        </p>
        <p className="mt-1 text-[11px] text-white/80">
          Fast* · Secure* · Trusted by someone&trade;
        </p>
        <button
          onClick={handleRedirect}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-yellow-400 py-2.5 text-xs font-black uppercase text-purple-900 shadow-[0_3px_0_#a16207] active:translate-y-0.5 active:shadow-none"
        >
          Continue to external site
          <ExternalLink size={13} />
        </button>
        <p className="mt-2 text-center text-[9px] text-white/60">
          You will leave CampusCash. *Terms apply. Re-login may be required.
        </p>
      </div>

      {phase !== "idle" && (
        <PhoneOverlay>
          {phase === "redirecting" ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-white px-8">
              <Loader2 size={22} className="animate-spin text-purple-600" />
              <p className="text-center text-xs text-gray-500">
                Redirecting to
                <br />
                <span className="font-mono text-[11px] text-gray-700">
                  payportal-secure-payments.example.com
                </span>
              </p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-1/3 rounded-full bg-purple-500 skeleton-shimmer" />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col bg-gray-100">
              {/* Fake external-browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-300 bg-gray-200 px-3 py-2">
                <Globe size={13} className="text-gray-500" />
                <span className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-[10px] text-gray-600">
                  payportal-secure-payments.example.com/auth
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <TriangleAlert size={18} />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  Session handoff required
                </p>
                <p className="text-xs leading-relaxed text-gray-500">
                  Your CampusCash session doesn&apos;t carry over. Please
                  re-authenticate with your PayPortal™ credentials to continue
                  your payment.
                </p>
                <button
                  onClick={handleReturn}
                  className="mt-2 rounded-lg bg-navy px-5 py-2.5 text-xs font-semibold text-white"
                >
                  ← Back to CampusCash
                </button>
                <p className="text-[10px] text-gray-400">
                  (38% of users never make it past this screen)
                </p>
              </div>
            </div>
          )}
        </PhoneOverlay>
      )}
    </>
  );
}
