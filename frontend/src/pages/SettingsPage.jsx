import { useEffect, useState } from 'react';
import {
  Lock, Bell, Shield,
  Smartphone, Mail, Trash2, Cookie
} from 'lucide-react';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, Input } from '../components/UI';
import {
  getCookieConsent,
  acceptAllCookieConsent,
  rejectNonEssentialCookieConsent,
  saveCookieConsent,
  clearCookieConsent,
  openCookieBanner,
  loadCookieConsentFromServer
} from '../services/cookieConsentService';

function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email_booking: true,
    email_promo: false,
    sms_booking: true,
    sms_promo: false
  });

  const existingConsent = getCookieConsent();
  const [cookiePrefs, setCookiePrefs] = useState({
    preferences: existingConsent?.preferences?.preferences || false,
    analytics: existingConsent?.preferences?.analytics || false,
    marketing: existingConsent?.preferences?.marketing || false
  });
  const [cookieMsg, setCookieMsg] = useState('');

  useEffect(() => {
    const loadServerConsent = async () => {
      const payload = await loadCookieConsentFromServer();
      if (!payload?.preferences) return;
      setCookiePrefs({
        preferences: Boolean(payload.preferences.preferences),
        analytics: Boolean(payload.preferences.analytics),
        marketing: Boolean(payload.preferences.marketing)
      });
    };
    loadServerConsent();
  }, []);

  const toggleNotif = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveCookiePrefs = () => {
    saveCookieConsent(cookiePrefs);
    setCookieMsg('Preferences cookies enregistrees.');
  };

  const acceptAllCookies = () => {
    acceptAllCookieConsent();
    setCookiePrefs({ preferences: true, analytics: true, marketing: true });
    setCookieMsg('Tous les cookies optionnels ont ete actives.');
  };

  const rejectOptionalCookies = () => {
    rejectNonEssentialCookieConsent();
    setCookiePrefs({ preferences: false, analytics: false, marketing: false });
    setCookieMsg('Les cookies optionnels ont ete desactives.');
  };

  const reopenCookieBanner = () => {
    clearCookieConsent();
    openCookieBanner();
    setCookieMsg('Le bandeau cookies a ete reouvert.');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Parametres du compte</h1>
          <p className="text-slate-500">Gerez vos preferences, votre securite et vos notifications.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Lock className="w-6 h-6 mr-3 text-primary-600" />
            Securite et mot de passe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe actuel</label>
                <Input type="password" placeholder="********" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau mot de passe</label>
                <Input type="password" placeholder="********" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
                <Input type="password" placeholder="********" />
              </div>
              <Button className="mt-2">Mettre a jour le mot de passe</Button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
              <h3 className="font-bold text-slate-900 mb-2">Conseils de securite</h3>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>Utilisez au moins 8 caracteres</li>
                <li>Incluez des majuscules et des chiffres</li>
                <li>Ne partagez jamais votre mot de passe</li>
                <li>Changez-le regulierement</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-amber-500" />
            Preferences de notifications
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Notifications email</p>
                  <p className="text-sm text-slate-500">Recevez des emails pour vos reservations</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications.email_booking}
                  onChange={() => toggleNotif('email_booking')}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Notifications SMS</p>
                  <p className="text-sm text-slate-500">Soyez alerte par SMS en temps reel</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications.sms_booking}
                  onChange={() => toggleNotif('sms_booking')}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Cookie className="w-6 h-6 mr-3 text-emerald-600" />
            Preferences cookies
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">Cookies essentiels</p>
                <p className="text-sm text-slate-500">Toujours actifs pour la connexion et la securite.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Actif</span>
            </div>

            {[
              ['preferences', 'Preferences', 'Memoriser vos choix d interface.'],
              ['analytics', 'Mesure d audience', 'Aider a ameliorer le produit.'],
              ['marketing', 'Marketing', 'Personnaliser les campagnes publicitaires.']
            ].map(([key, label, description]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={cookiePrefs[key]}
                    onChange={() => setCookiePrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={rejectOptionalCookies}>
              Refuser les optionnels
            </Button>
            <Button variant="outline" size="sm" onClick={acceptAllCookies}>
              Accepter tous
            </Button>
            <Button size="sm" onClick={saveCookiePrefs}>
              Enregistrer
            </Button>
            <Button variant="outline" size="sm" onClick={reopenCookieBanner}>
              Reouvrir le bandeau
            </Button>
          </div>

          {cookieMsg && <p className="mt-3 text-sm text-emerald-700">{cookieMsg}</p>}
        </Card>

        <div className="border border-red-100 rounded-2xl bg-red-50 p-8">
          <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-3" />
            Zone de danger
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-red-900">Supprimer mon compte</p>
              <p className="text-sm text-red-700">Cette action est irreversible. Toutes vos donnees seront effacees.</p>
            </div>
            <Button variant="danger" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SettingsPage;

