import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { Button } from './UI';
import {
  hasCookieConsent,
  acceptAllCookieConsent,
  rejectNonEssentialCookieConsent,
  saveCookieConsent
} from '../services/cookieConsentService';

export default function CookieConsentBanner() {
  const [openCustomize, setOpenCustomize] = useState(false);
  const [hidden, setHidden] = useState(() => hasCookieConsent());
  const [prefs, setPrefs] = useState({
    preferences: false,
    analytics: false,
    marketing: false
  });

  const isVisible = useMemo(() => !hidden, [hidden]);

  useEffect(() => {
    const onOpen = () => {
      setHidden(false);
      setOpenCustomize(true);
    };
    window.addEventListener('cookie-consent-open', onOpen);
    return () => window.removeEventListener('cookie-consent-open', onOpen);
  }, []);

  if (!isVisible) return null;

  const acceptAll = () => {
    acceptAllCookieConsent();
    setHidden(true);
  };

  const rejectAll = () => {
    rejectNonEssentialCookieConsent();
    setHidden(true);
  };

  const saveCustom = () => {
    saveCookieConsent(prefs);
    setHidden(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Gestion des cookies</p>
              <p className="text-sm text-slate-600">
                Nous utilisons des cookies essentiels pour faire fonctionner la plateforme. Les cookies optionnels
                (préférences, analytics, marketing) sont activés uniquement avec votre consentement.
              </p>
              <Link to="/politique-cookies" className="mt-1 inline-block text-sm text-primary-700 hover:text-primary-800">
                Voir la politique des cookies
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenCustomize((v) => !v)}>
              Personnaliser
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={rejectAll}>
              Refuser
            </Button>
            <Button type="button" size="sm" onClick={acceptAll}>
              Tout accepter
            </Button>
          </div>
        </div>

        {openCustomize && (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
            {[
              ['preferences', 'Préférences'],
              ['analytics', 'Mesure d’audience'],
              ['marketing', 'Marketing']
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
              </label>
            ))}
            <div className="md:col-span-3 flex justify-end">
              <Button type="button" size="sm" onClick={saveCustom}>
                Enregistrer mes choix
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
