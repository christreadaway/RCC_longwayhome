import { useState, useEffect } from 'react';

/**
 * Returns a breakpoint class string based on current window dimensions.
 * Used to drive both CSS layout and JSX conditional rendering.
 *
 * Breakpoints:
 * - bp-desktop: width >= 1024px
 * - bp-tablet:  640px <= width < 1024px
 * - bp-mobile:  width < 640px
 * - bp-landscape-phone: any width but height < 480px (overrides to side-by-side)
 */
export function useWindowWidth() {
  const [bp, setBp] = useState(() => classify(window.innerWidth, window.innerHeight));

  useEffect(() => {
    function onResize() {
      setBp(classify(window.innerWidth, window.innerHeight));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

function classify(w, h) {
  const landscape = h < 480;
  if (landscape) return 'bp-desktop'; // landscape phone forces side-by-side
  if (w >= 1024) return 'bp-desktop';
  if (w >= 640) return 'bp-tablet';
  return 'bp-mobile';
}
