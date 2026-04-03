import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map();

const getScrollKey = (location) => `${location.pathname}${location.search}${location.hash}`;

export default function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const scrollKey = getScrollKey(location);
    const savedPosition = scrollPositions.get(scrollKey);

    if (location.hash) {
      return () => {
        scrollPositions.set(scrollKey, { x: window.scrollX, y: window.scrollY });
      };
    }

    window.requestAnimationFrame(() => {
      if (navigationType === 'POP' && savedPosition) {
        window.scrollTo({ top: savedPosition.y, left: savedPosition.x, behavior: 'auto' });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => {
      scrollPositions.set(scrollKey, { x: window.scrollX, y: window.scrollY });
    };
  }, [location, navigationType]);

  return null;
}
