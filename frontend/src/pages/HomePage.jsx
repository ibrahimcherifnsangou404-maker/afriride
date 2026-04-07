import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Footer } from '../components/Layout/Footer';
import { Button, Card } from '../components/UI';

const proofMetrics = [
  { value: '50+', label: 'Agences partenaires' },
  { value: '1000+', label: 'Vehicules actifs' },
  { value: '98%', label: 'Satisfaction client' },
  { value: '< 3 min', label: 'Reservation moyenne' }
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Confiance des le premier clic',
    text: 'Agences verifiees, vehicules controles, standards operationnels clairs.'
  },
  {
    icon: CreditCard,
    title: 'Paiement simple et securise',
    text: 'Parcours de paiement lisible, rapide et fiable sur mobile comme desktop.'
  },
  {
    icon: Clock3,
    title: 'Execution sans friction',
    text: 'Disponibilites a jour, confirmation immediate, support reactif.'
  }
];

const steps = [
  { icon: Search, title: 'Rechercher', text: 'Selectionnez dates, categorie et budget.' },
  { icon: Calendar, title: 'Comparer', text: 'Comparez offres agences et conditions.' },
  { icon: CheckCircle2, title: 'Confirmer', text: 'Validez en quelques clics, sans ambiguite.' }
];

function HomePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const stepTargets = {
    Rechercher: '/vehicles',
    Comparer: '/vehicles',
    Confirmer: isAuthenticated ? '/my-bookings' : '/login'
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F7] text-slate-900 pt-16">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-[#F3F5F7]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-slate-200/80 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl animate-[pulse_9s_ease-in-out_infinite]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="relative container mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-4xl animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
              <Sparkles className="w-4 h-4 text-primary-700" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-600">
                Plateforme location premium
              </span>
            </div>

            <h1 className="mt-6 text-5xl md:text-7xl leading-[0.95] tracking-tight font-bold text-slate-900">
              Louez mieux,
              <span className="block bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent">
                decidez plus vite.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg md:text-[1.6rem] leading-relaxed text-slate-600">
              Une experience premium pour comparer clairement, reserver rapidement et operer en confiance.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <Link to="/vehicles">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:-translate-y-0.5">
                  <Search className="w-5 h-5 mr-2" />
                  Voir les offres
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to={isAuthenticated ? '/manager/dashboard' : '/partner-signup'}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-slate-300 text-slate-800 bg-white hover:bg-slate-100 transition-all duration-300 hover:-translate-y-0.5">
                  {isAuthenticated ? 'Acceder au dashboard' : 'Devenir partenaire'}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: Lock, text: 'Paiement securise et tracable' },
                { icon: Building2, text: 'Reseau agences qualifiees' },
                { icon: Users, text: 'Experience client premium' }
              ].map((item, idx) => (
                <div
                  key={item.text}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm animate-fade-in transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: `${120 + idx * 120}ms` }}
                >
                  <item.icon className="w-4 h-4 text-primary-700" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {proofMetrics.map((item, idx) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${220 + idx * 140}ms` }}
              >
                <p className="text-3xl md:text-[2rem] font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="max-w-3xl animate-fade-in">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Design pour la confiance</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              Lisibilite maximale, decisions rapides
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((item, idx) => (
              <Card
                key={item.title}
                className="rounded-2xl p-8 border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${120 + idx * 140}ms` }}
                hover
              >
                <div className="inline-flex p-2.5 rounded-lg bg-primary-50 border border-primary-100">
                  <item.icon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Flow optimise</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Reservation en 3 etapes</h2>
            </div>
            <Link to="/vehicles" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Voir toutes les offres
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <Link
                key={step.title}
                to={stepTargets[step.title]}
                className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-primary-200 transition-all animate-fade-in"
                style={{ animationDelay: `${100 + index * 140}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex p-2 rounded-lg bg-slate-100 group-hover:bg-primary-50 transition-colors">
                    <step.icon className="w-5 h-5 text-slate-700 group-hover:text-primary-700 transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-2xl shadow-black/20 animate-fade-in">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary-100 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-slate-100 blur-2xl" />
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold">Next move</p>
                <h2 className="mt-3 text-3xl md:text-5xl leading-tight font-bold text-slate-900">
                  Faites passer votre experience location au niveau premium
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/vehicles">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-6 bg-primary-600 text-white hover:bg-primary-700 transition-all duration-300 hover:-translate-y-0.5">
                    Reserver maintenant
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/partner-signup">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 border-slate-300 text-slate-800 hover:bg-slate-100 transition-all duration-300 hover:-translate-y-0.5">
                      <Building2 className="w-5 h-5 mr-2" />
                      Devenir partenaire
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;
