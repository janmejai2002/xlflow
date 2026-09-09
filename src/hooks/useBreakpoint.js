import { useState, useEffect } from 'react';

export const LAYOUT_STORAGE_KEY = 'xlflow_layout_mode';

/**
 * Responsive viewport breakpoint and layout mode detector
 * Accurately detects laptops (including 125%/150% Windows display scaling)
 * and supports persistent user layout override ('auto' | 'desktop' | 'mobile')
 */
export function useBreakpoint() {
  const [layoutPreference, setLayoutPreferenceState] = useState(() => {
    if (typeof window === 'undefined') return 'auto';
    return localStorage.getItem(LAYOUT_STORAGE_KEY) || 'auto';
  });

  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 800) return 'tablet';
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

  const setLayoutPreference = (mode) => {
    setLayoutPreferenceState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
    }
  };

  // Determine whether to show Desktop Horizon Deck
  let isDesktop = false;
  if (layoutPreference === 'desktop') {
    isDesktop = true;
  } else if (layoutPreference === 'mobile') {
    isDesktop = false;
  } else {
    // 'auto' mode:
    // 1. If viewport is 800px or wider -> Desktop Horizon Deck
    // 2. If physical screen is >= 1024px and device has fine pointer (mouse/trackpad on laptop) and viewport >= 640px -> Desktop
    const isFinePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const isPhysicalLaptop = typeof window !== 'undefined' && window.screen && window.screen.width >= 1024;
    
    if (windowWidth >= 800) {
      isDesktop = true;
    } else if (isPhysicalLaptop && isFinePointer && windowWidth >= 640) {
      isDesktop = true;
    } else {
      isDesktop = false;
    }
  }

  return {
    breakpoint,
    windowWidth,
    isMobile: !isDesktop,
    isTablet: breakpoint === 'tablet',
    isDesktop,
    layoutPreference,
    setLayoutPreference,
    toggleLayoutMode: () => {
      const next = isDesktop ? 'mobile' : 'desktop';
      setLayoutPreference(next);
      return next;
    }
  };
}
