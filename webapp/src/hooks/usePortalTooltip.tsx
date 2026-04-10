import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * usePortalTooltip - React hook for managing tooltip position in a portal.
 * Returns { ref, pos, show, hide } for tooltip management.
 */
export function usePortalTooltip<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [pos, setPos] = useState<{
    x: number;
    y: number;
    below: boolean;
  } | null>(null);

  const hide = useCallback(() => setPos(null), []);
  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const below = r.top < 80;
    setPos({ x: r.left + r.width / 2, y: below ? r.bottom : r.top, below });
  }, []);

  useEffect(() => {
    if (!pos) return;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide, { passive: true });
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [pos, hide]);

  return { ref, pos, show, hide };
}

export function TooltipPortal({
  pos,
  children,
}: {
  pos: { x: number; y: number; below: boolean };
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className={`cell-tooltip-portal${pos.below ? ' cell-tooltip-portal-below' : ''}`}
      style={{
        left: `${pos.x}px`,
        top: pos.below ? `${pos.y + 8}px` : `${pos.y - 8}px`,
      }}
      role="tooltip"
    >
      {children}
    </div>,
    document.body,
  );
}
