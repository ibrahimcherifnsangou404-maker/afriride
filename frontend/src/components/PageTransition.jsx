import { useLocation } from 'react-router-dom';

/**
 * PageTransition - Wraps page content and plays a fade+slide-up animation
 * every time the route changes.
 * Using location.key (unique per navigation event) as the React key so that
 * React naturally re-mounts the wrapper on each navigation, triggering the
 * CSS animation without the double-trigger white-flash caused by mixing
 * key + useEffect.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const transitionKey = location.pathname;

  return (
    <div key={transitionKey} className="page-enter-active">
      {children}
    </div>
  );
}
