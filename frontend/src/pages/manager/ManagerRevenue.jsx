import { useState, useEffect, useContext, useMemo, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Activity,
  Receipt,
  Download,
  Filter,
  ArrowUpRight,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { AuthContext } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import { PageSkeleton } from '../../components/UI';
import { paymentService } from '../../services/paymentService';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatShortMoney = (value) => {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.round(num / 1000)}k`;
  return `${num}`;
};

const KpiCard = ({ label, value, note, icon, tone = 'emerald', trend, trendValue }) => {
  const toneStyles = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-sky-500 to-blue-600',
    amber: 'from-amber-500 to-orange-500',
    slate: 'from-slate-700 to-slate-900'
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br ${toneStyles[tone]} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-xl bg-slate-100 p-2.5">
            {createElement(icon, { className: "h-5 w-5 text-slate-700" })}
          </div>
          {trend && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trendValue}
            </span>
          )}
        </div>
        <p className="text-2xl font-black tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
        {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
      </div>
    </div>
  );
};

const RevenueAreaChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="flex h-[340px] items-center justify-center text-slate-400">Aucune donnée de revenus</div>;
  }

  const width = 900;
  const height = 260;
  const padX = 24;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d) => Number(d.value || 0));
  const max = Math.max(...points, 1);

  const toX = (i) => (data.length === 1 ? padX + innerW / 2 : padX + (i * innerW) / (data.length - 1));
  const toY = (v) => padY + innerH - (v / max) * innerH;

  const coords = points.map((v, i) => ({ x: toX(i), y: toY(v), value: v, name: data[i]?.name || '' }));

  const linePath = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(padY + innerH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(padY + innerH).toFixed(2)} Z`;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">12 derniers mois</p>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">FCFA</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
          <defs>
            <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, i) => {
            const y = padY + (innerH * i) / 4;
            const value = Math.round(max - (max * i) / 4);
            return (
              <g key={`grid-${i}`}>
                <line x1={padX} y1={y} x2={padX + innerW} y2={y} stroke="#cbd5e1" strokeDasharray="4 6" />
                <text x={4} y={y + 4} fontSize="11" fill="#64748b" fontWeight="600">
                  {formatShortMoney(value)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#revArea)" />
          <path d={linePath} fill="none" stroke="url(#revStroke)" strokeWidth="4" strokeLinecap="round" />

          {coords.map((p, i) => (
            <g key={`pt-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#059669" strokeWidth="3" />
              <title>{`${p.name}: ${Number(p.value).toLocaleString('fr-FR')} FCFA`}</title>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {data.map((d, i) => (
          <div key={`${d.name}-${i}`} className="truncate text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {String(d.name || '').slice(0, 3)}
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentMixCard = ({ transactions = [] }) => {
  const paid = transactions.filter((t) => t.paymentStatus === 'paid').length;
  const pending = transactions.filter((t) => t.paymentStatus === 'pending').length;
  const failed = transactions.filter((t) => t.paymentStatus === 'failed').length;
  const refunded = transactions.filter((t) => t.paymentStatus === 'refunded').length;
  const total = Math.max(transactions.length, 1);

  const bars = [
    { label: 'Payé', value: paid, color: 'bg-emerald-500', icon: CheckCircle2 },
    { label: 'En attente', value: pending, color: 'bg-amber-500', icon: AlertCircle },
    { label: 'Échec', value: failed, color: 'bg-red-500', icon: XCircle },
    { label: 'Remboursé', value: refunded, color: 'bg-slate-500', icon: Receipt }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <h4 className="text-lg font-black text-slate-900">Qualité des paiements</h4>
      <p className="mt-1 text-sm text-slate-500">Distribution de vos transactions filtrées</p>
      <div className="mt-6 space-y-4">
        {bars.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="text-sm font-bold text-slate-800">{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ManagerRevenue() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    paymentStatus: ''
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await managerService.getRevenueStats(filters);
        setStats(response.data);
      } catch (error) {
        console.error('Erreur chargement revenus:', error);
        addToast('Impossible de charger les données financières', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, navigate, filters]);

  const addToast = (message, type = 'info') => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      paymentStatus: ''
    });
  };

  const handleDownloadReceipt = async (paymentId) => {
    if (!paymentId) return;
    try {
      const response = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AfriRide_Receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      addToast('Impossible de télécharger le reçu', 'error');
    }
  };

  const downloadCsvReport = () => {
    const rows = stats?.transactions || [];
    if (!rows.length) return;
    const header = ['Date', 'Vehicule', 'Client', 'Montant', 'Statut', 'Paiement'].join(',');
    const body = rows
      .map((tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString('fr-FR');
        const vehicle = `${tx.vehicle?.brand || ''} ${tx.vehicle?.model || ''}`.trim();
        const client = `${tx.user?.firstName || ''} ${tx.user?.lastName || ''}`.trim();
        const amount = Number(tx.totalPrice || 0).toLocaleString('fr-FR');
        const status = tx.status || '';
        const payment = tx.paymentStatus || '';
        return [date, `"${vehicle}"`, `"${client}"`, amount, status, payment].join(',');
      })
      .join('\n');

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'afriride_revenue_report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const insights = useMemo(() => {
    const transactions = stats?.transactions || [];
    const paid = transactions.filter((tx) => tx.paymentStatus === 'paid').length;
    const completed = transactions.filter((tx) => tx.status === 'completed').length;
    const paidRate = transactions.length ? Math.round((paid / transactions.length) * 100) : 0;
    const completedRate = transactions.length ? Math.round((completed / transactions.length) * 100) : 0;
    return { paidRate, completedRate };
  }, [stats]);

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/40 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast message={t.message} type={t.type} onClose={() => { }} />
            </div>
          ))}
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
                <Activity className="h-3.5 w-3.5" />
                Revenue Intelligence
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Pilotage Financier Pro</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Vision claire de la performance, de la qualité des paiements et de la dynamique de revenus.
              </p>
            </div>
            <button
              onClick={downloadCsvReport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Exporter le rapport CSV
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Filter className="h-4 w-4" />
            Filtres
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Date début</span>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Date fin</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Statut booking</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Statut paiement</span>
              <select
                name="paymentStatus"
                value={filters.paymentStatus}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="failed">Échec</option>
                <option value="refunded">Remboursé</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Revenu Total"
            value={formatMoney(stats?.totalRevenue)}
            note="Somme des paiements filtrés"
            icon={Wallet}
            tone="emerald"
            trend="up"
            trendValue="+15%"
          />
          <KpiCard
            label="Dernier mois"
            value={formatMoney(stats?.chartData?.[stats?.chartData?.length - 1]?.value || 0)}
            note="Performance mensuelle récente"
            icon={Calendar}
            tone="blue"
            trend="up"
            trendValue="+4.2%"
          />
          <KpiCard
            label="Projection"
            value={formatMoney(stats?.expectedRevenue)}
            note="Estimation fin de période"
            icon={ArrowUpRight}
            tone="slate"
          />
          <KpiCard
            label="Panier Moyen"
            value={formatMoney(Math.round(stats?.avgBasket || 0))}
            note="Montant moyen par location"
            icon={Receipt}
            tone="amber"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">Evolution des revenus</h3>
                  <p className="mt-1 text-sm text-slate-500">Courbe de tendance sur les 12 derniers mois</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Temps réel</span>
              </div>
              <RevenueAreaChart data={stats?.chartData || []} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Historique des transactions</h3>
                <span className="text-sm font-semibold text-slate-500">{stats?.transactions?.length || 0} lignes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Véhicule</th>
                      <th className="py-3 pr-4">Client</th>
                      <th className="py-3 pr-4">Montant</th>
                      <th className="py-3 pr-4">Statut</th>
                      <th className="py-3 pr-4">Paiement</th>
                      <th className="py-3 text-right">Reçu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.transactions || []).map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-3 pr-4 text-slate-600">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="py-3 pr-4 font-semibold text-slate-800">{tx.vehicle?.brand} {tx.vehicle?.model}</td>
                        <td className="py-3 pr-4 text-slate-700">{tx.user?.firstName} {tx.user?.lastName}</td>
                        <td className="py-3 pr-4 font-bold text-slate-900">{formatMoney(tx.totalPrice)}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{tx.status}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            tx.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.paymentStatus === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : tx.paymentStatus === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDownloadReceipt(tx.paymentId)}
                            disabled={!tx.paymentId}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PaymentMixCard transactions={stats?.transactions || []} />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h4 className="text-lg font-black text-slate-900">Indicateurs clés</h4>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Taux de paiement réussi</p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">{insights.paidRate}%</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Taux de réservations terminées</p>
                  <p className="mt-1 text-2xl font-black text-blue-800">{insights.completedRate}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
              <h4 className="text-lg font-black">Derniers paiements</h4>
              <div className="mt-4 space-y-3">
                {stats?.recentTransactions?.length ? (
                  stats.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{tx.vehicle?.brand} {tx.vehicle?.model}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="ml-3 inline-flex items-center gap-1 font-black text-emerald-300">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatShortMoney(tx.totalPrice)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">Aucune transaction récente</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



