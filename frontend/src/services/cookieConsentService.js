import { userService } from './userService';

const STORAGE_KEY = 'afriride_cookie_consent_v1';
const CONSENT_VERSION = '2026-03-08';

const basePreferences = {
  essential: true,
  preferences: false,
  analytics: false,
  marketing: false
};

export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasCookieConsent() {
  return Boolean(getCookieConsent());
}

export function saveCookieConsent(preferences) {
  const payload = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    preferences: {
      ...basePreferences,
      ...preferences,
      essential: true
    }
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));
  syncCookieConsentToServer(payload);
  return payload;
}

export function acceptAllCookieConsent() {
  return saveCookieConsent({
    preferences: true,
    analytics: true,
    marketing: true
  });
}

export function rejectNonEssentialCookieConsent() {
  return saveCookieConsent({
    preferences: false,
    analytics: false,
    marketing: false
  });
}

export function canUseCookieCategory(category) {
  if (category === 'essential') return true;
  const consent = getCookieConsent();
  return Boolean(consent?.preferences?.[category]);
}

export function clearCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: null }));
}

export function openCookieBanner() {
  window.dispatchEvent(new CustomEvent('cookie-consent-open'));
}

function hasAuthToken() {
  return Boolean(localStorage.getItem('token'));
}

async function syncCookieConsentToServer(payload) {
  if (!hasAuthToken()) return;
  try {
    await userService.updateCookieConsent(payload);
  } catch (error) {
    console.error('Sync cookie consent backend échouée:', error);
  }
}

export async function loadCookieConsentFromServer() {
  if (!hasAuthToken()) return null;
  try {
    const response = await userService.getCookieConsent();
    const payload = response?.data || null;
    if (!payload) return null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));
    return payload;
  } catch (error) {
    console.error('Chargement cookie consent backend échoué:', error);
    return null;
  }
}
