import { useLayoutEffect, useState } from 'react';

export function useContainerWidth(ref: React.RefObject<any>) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    function updateWidth() {
      setWidth(ref.current.offsetWidth || 0);
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);

  return width;
}
