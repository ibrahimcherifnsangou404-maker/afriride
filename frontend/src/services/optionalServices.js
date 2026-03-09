import { canUseCookieCategory } from './cookieConsentService';

let analyticsScriptLoaded = false;

function initGoogleAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  const consented = canUseCookieCategory('analytics');
  window[`ga-disable-${measurementId}`] = !consented;
  if (!consented) return;

  if (!analyticsScriptLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    analyticsScriptLoaded = true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
}

export function initOptionalServices() {
  initGoogleAnalytics();
}

