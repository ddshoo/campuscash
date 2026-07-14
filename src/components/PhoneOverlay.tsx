"use client";

import { createPortal } from "react-dom";
import { useHydrated } from "@/lib/useHydrated";

/**
 * Portals children into the phone frame's overlay root (see app/layout.tsx).
 *
 * Why not `position: fixed`? Fixed positioning is viewport-relative, so a
 * modal would stretch across the dev panel too. Portaling into an absolutely
 * positioned element inside the (non-scrolling) phone frame keeps overlays
 * clipped to exactly the consumer view, wherever the page is scrolled.
 */
export default function PhoneOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  // Portal targets only exist in the browser — skip the SSR pass.
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const root = document.getElementById("phone-overlay-root");
  if (!root) return null;
  return createPortal(
    <div className="absolute inset-0 z-50">{children}</div>,
    root
  );
}
