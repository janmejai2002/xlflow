import { useState, useEffect } from 'react';

/**
 * Responsive viewport breakpoint detector
 * Returns 'mobile' (< 768px), 'tablet' (768px - 1023px), or 'desktop' (>= 1024px)
 */
export function useBreakpoint() {
  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  };

  const [breakpoint, setBreakpoint] = useState(getBreakpoint);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint());
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    windowWidth,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
}
