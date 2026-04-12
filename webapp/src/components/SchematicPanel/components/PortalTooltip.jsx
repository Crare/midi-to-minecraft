import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ── Portal tooltip hook ───────────────────────────────────────────────────────
// overflow-x:auto on the scroll container coerces overflow-y:visible → auto,
// which clips absolutely-positioned children. Portaling into document.body
// with position:fixed escapes the clip.
export function usePortalTooltip() {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const hide = useCallback(() => setPos(null), []);
  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    // Show below if there's less than 80px above (near viewport top).
    const below = r.top < 80;
    setPos({ x: r.left + r.width / 2, y: below ? r.bottom : r.top, below });
  }, []);

  // Dismiss if the viewport scrolls or resizes (keeps fixed pos from going stale).
  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", hide, { passive: true, capture: true });
    window.addEventListener("resize", hide, { passive: true });
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("resize", hide);
    };
  }, [pos, hide]);

  return { ref, pos, show, hide };
}

export function TooltipPortal({ pos, children }) {
  return createPortal(
    <div
      className={`cell-tooltip-portal${pos.below ? " cell-tooltip-portal-below" : ""}`}
      style={{
        left: `${pos.x}px`,
        top: pos.below ? `${pos.y + 8}px` : `${pos.y - 8}px`
      }}
      role="tooltip"
    >
      {children}
    </div>,
    document.body
  );
}
