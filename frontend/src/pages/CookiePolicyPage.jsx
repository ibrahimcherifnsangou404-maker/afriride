import { Footer } from '../components/Layout/Footer';
import LegalVersionNotice from '../components/LegalVersionNotice';

function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Politique de cookies</h1>
          <p className="mt-2 text-sm text-slate-500">Dernière mise à jour: 8 mars 2026</p>

          <div className="mt-8 space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">1. Qu'est-ce qu'un cookie</h2>
              <p className="mt-2">
                Un cookie est un petit fichier stocké sur votre appareil qui permet de reconnaître votre navigateur et de mémoriser
                certaines informations utiles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">2. Cookies utilisés</h2>
              <p className="mt-2">
                AfriRide utilise principalement des cookies techniques (authentification/session), de préférences (langue, affichage)
                et, le cas échéant, des cookies de mesure d'audience pour améliorer le service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">3. Gestion de vos choix</h2>
              <p className="mt-2">
                Vous pouvez configurer votre navigateur pour refuser tout ou partie des cookies. Certaines fonctionnalités peuvent
                toutefois ne plus fonctionner correctement si vous bloquez les cookies essentiels.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">4. Durée de conservation</h2>
              <p className="mt-2">
                Les cookies sont conservés pour une durée limitée, proportionnée à leur finalité. Les cookies de session sont supprimés
                à la fermeture du navigateur.
              </p>
            </section>
          </div>

          <LegalVersionNotice
            version="v2026-03-08"
            updatedAt="8 mars 2026"
            changes={[
              'Ajout des catégories de consentement (préférences, analytics, marketing).',
              'Documentation de la gestion des choix depuis Paramètres.',
              'Alignement avec le bandeau cookies de l’application.'
            ]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CookiePolicyPage;
