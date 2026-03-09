import { Footer } from '../components/Layout/Footer';
import LegalVersionNotice from '../components/LegalVersionNotice';

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-slate-500">Dernière mise à jour: 8 mars 2026</p>

          <div className="mt-8 space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">1. Données collectées</h2>
              <p className="mt-2">
                Nous collectons les informations nécessaires au fonctionnement du service: identité, coordonnées, données de réservation,
                échanges de messagerie et documents KYC transmis par l'utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">2. Finalités</h2>
              <p className="mt-2">
                Ces données sont utilisées pour créer le compte, gérer les réservations, sécuriser les transactions, prévenir la fraude,
                améliorer l'expérience utilisateur et respecter nos obligations réglementaires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">3. Partage des données</h2>
              <p className="mt-2">
                Vos données peuvent être partagées avec les agences concernées par vos réservations et avec des prestataires techniques
                (paiement, hébergement, notifications), uniquement dans la limite nécessaire à la prestation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">4. Conservation</h2>
              <p className="mt-2">
                Nous conservons les données pendant la durée strictement nécessaire à la gestion du service et aux obligations légales.
                Les documents sensibles sont protégés par des mesures techniques et organisationnelles adaptées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">5. Vos droits</h2>
              <p className="mt-2">
                Vous pouvez demander l'accès, la rectification ou la suppression de vos données, sous réserve des obligations légales
                de conservation. Pour toute demande, contactez: contact@afriride.com.
              </p>
            </section>
          </div>

          <LegalVersionNotice
            version="v2026-03-08"
            updatedAt="8 mars 2026"
            changes={[
              'Précision des finalités de traitement liées au KYC.',
              'Clarification du partage avec prestataires techniques.',
              'Rappel des droits utilisateur et du contact de demande.'
            ]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;
