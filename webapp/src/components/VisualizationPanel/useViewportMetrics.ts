import { useEffect, useState } from 'react';

const NARROW_SCREEN_PX = 700;

function unitSizeForWidth(width: number) {
  return width <= NARROW_SCREEN_PX ? 30 : 34;
}

/** Window-size driven metrics; also publishes the unit size as a CSS variable. */
export function useViewportMetrics() {
  const [trackUnitSize, setTrackUnitSize] = useState(() =>
    typeof window !== 'undefined' ? unitSizeForWidth(window.innerWidth) : 34
  );
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--track-unit-size', `${trackUnitSize}px`);
  }, [trackUnitSize]);

  useEffect(() => {
    const sync = () => {
      setTrackUnitSize(unitSizeForWidth(window.innerWidth));
      setWindowHeight(window.innerHeight);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return { trackUnitSize, windowHeight };
}
