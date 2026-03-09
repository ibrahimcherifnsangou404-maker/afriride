import { Footer } from '../components/Layout/Footer';
import LegalVersionNotice from '../components/LegalVersionNotice';

function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Conditions d'utilisation</h1>
          <p className="mt-2 text-sm text-slate-500">Dernière mise à jour: 8 mars 2026</p>

          <div className="mt-8 space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">1. Objet du service</h2>
              <p className="mt-2">
                AfriRide met en relation des clients et des agences de location de véhicules. La plateforme permet la consultation,
                la réservation, la communication et le paiement selon les règles publiées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">2. Compte utilisateur</h2>
              <p className="mt-2">
                Vous êtes responsable des informations fournies lors de l'inscription et de la confidentialité de vos accès.
                Toute activité réalisée avec votre compte est réputée effectuée par vous.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">3. Vérification d'identité (KYC)</h2>
              <p className="mt-2">
                Certains services, notamment la finalisation du paiement d'une réservation, nécessitent une identité vérifiée.
                AfriRide peut refuser ou suspendre un service en cas de dossier incomplet ou non conforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">4. Réservations et paiements</h2>
              <p className="mt-2">
                Les disponibilités, montants et statuts sont affichés dans l'application. Une réservation peut être annulée
                automatiquement selon les délais indiqués (ex: verrou de réservation expiré).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">5. Responsabilités</h2>
              <p className="mt-2">
                L'utilisateur s'engage à utiliser la plateforme conformément aux lois applicables. AfriRide peut limiter, suspendre
                ou supprimer l'accès en cas d'usage abusif, fraude, ou non-respect des présentes conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">6. Modifications</h2>
              <p className="mt-2">
                AfriRide peut mettre à jour ces conditions à tout moment. La version en vigueur est celle publiée sur cette page.
              </p>
            </section>
          </div>

          <LegalVersionNotice
            version="v2026-03-08"
            updatedAt="8 mars 2026"
            changes={[
              'Ajout de la règle KYC avant finalisation du paiement.',
              'Clarification des responsabilités et des conditions de suspension.',
              'Mise en cohérence avec les politiques de confidentialité et cookies.'
            ]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TermsPage;
