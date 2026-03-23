import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition - Wraps page content and plays a fade+slide-up animation
 * every time the route changes.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset and replay animation on each route change
    el.classList.remove('page-enter-active');
    // Force reflow to restart animation
    void el.offsetHeight;
    el.classList.add('page-enter-active');
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="page-enter-active" key={location.pathname}>
      {children}
    </div>
  );
}
