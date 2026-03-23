import React from 'react';

/**
 * PageLoader - Displayed by Suspense while a lazy-loaded page chunk is being fetched.
 * Shows an animated logo + spinner for a premium feel.
 */
export default function PageLoader() {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-content">
        {/* Brand icon animation */}
        <div className="page-loader-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <circle cx="24" cy="24" r="20" stroke="#16a34a" strokeWidth="3" strokeOpacity="0.2" />
            <path
              d="M24 4a20 20 0 0 1 20 20"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              className="page-loader-spinner-arc"
            />
          </svg>
        </div>
        {/* Brand name */}
        <p className="page-loader-brand">AfriRide</p>
        {/* Dots animation */}
        <div className="page-loader-dots">
          <span className="page-loader-dot" style={{ animationDelay: '0ms' }} />
          <span className="page-loader-dot" style={{ animationDelay: '150ms' }} />
          <span className="page-loader-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
