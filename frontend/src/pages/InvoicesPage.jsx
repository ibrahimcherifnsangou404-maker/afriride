import { useState, useEffect, useContext } from 'react';
import {
  Receipt,
  Search,
  Download,
  Calendar,
  Filter,
  AlertCircle,
  Loader2,
  Building2,
  Wallet
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { TableSkeleton } from '../components/UI';

const formatAmount = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

const statusClasses = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-200 text-slate-700'
};

function InvoicesPage() {
  const { user } = useContext(AuthContext);
  const canUseB2B = user?.role === 'admin' || user?.role === 'manager';

  const [viewMode, setViewMode] = useState('detailed');
  const [invoices, setInvoices] = useState([]);
  const [consolidatedInvoices, setConsolidatedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');
  const now = new Date();
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear())
  });

  useEffect(() => {
    if (viewMode === 'consolidated' && canUseB2B) {
      loadConsolidatedInvoices();
    } else {
      loadInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, viewMode, canUseB2B]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await paymentService.getInvoices(filters);
      setInvoices(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement factures:', err);
      setInvoices([]);
      setError(err.response?.data?.message || 'Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const loadConsolidatedInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await paymentService.getConsolidatedInvoices({
        q: filters.q,
        month: filters.month,
        year: filters.year
      });
      setConsolidatedInvoices(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement consolidation B2B:', err);
      setConsolidatedInvoices([]);
      setError(err.response?.data?.message || 'Erreur lors du chargement des factures consolidees');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paymentId) => {
    try {
      setDownloadingId(paymentId);
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
      console.error('Erreur telechargement recu:', err);
      setError('Impossible de telecharger le recu');
    } finally {
      setDownloadingId('');
    }
  };

  const handleDownloadConsolidated = async (customerId) => {
    try {
      setDownloadingId(customerId);
      const response = await paymentService.downloadConsolidatedReceipt(customerId, {
        month: filters.month,
        year: filters.year
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AfriRide_B2B_${filters.year}${String(filters.month).padStart(2, '0')}_${customerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur telechargement facture consolidee:', err);
      setError('Impossible de telecharger la facture consolidee');
    } finally {
      setDownloadingId('');
    }
  };

  const onFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFilters = () => {
    const date = new Date();
    setFilters({
      q: '',
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      month: String(date.getMonth() + 1),
      year: String(date.getFullYear())
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-cyan-50/40 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">
                <Receipt className="h-3.5 w-3.5" />
                Billing Center
              </p>
              <h1 className="text-3xl font-black tracking-tight">Facturation</h1>
              <p className="mt-2 text-sm text-slate-300">
                Suivi des paiements et consolidation B2B mensuelle.
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold">
              Profil: {user?.role}
            </div>
          </div>
        </section>

        {canUseB2B && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${viewMode === 'detailed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Detail des paiements
              </button>
              <button
                type="button"
                onClick={() => setViewMode('consolidated')}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${viewMode === 'consolidated' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Facturation B2B consolidee
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Filter className="h-4 w-4" />
            Filtres
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500">Recherche</label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  value={filters.q}
                  onChange={onFilterChange}
                  placeholder="Vehicule, client, agence..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {viewMode === 'detailed' && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Statut</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Tous</option>
                    <option value="completed">Paye</option>
                    <option value="pending">En attente</option>
                    <option value="failed">Echec</option>
                    <option value="refunded">Rembourse</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Methode</label>
                  <select
                    name="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Toutes</option>
                    <option value="card">Carte</option>
                    <option value="momo_mtn">MTN MoMo</option>
                    <option value="momo_orange">Orange Money</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Du</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Au</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {viewMode === 'consolidated' && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Mois</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    name="month"
                    value={filters.month}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Annee</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    name="year"
                    value={filters.year}
                    onChange={onFilterChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="lg:col-span-2 flex items-end">
                  <div className="w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                    Consolidation mensuelle par client avec net = paye - rembourse.
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Reinitialiser
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              {viewMode === 'consolidated' ? 'Factures B2B consolidees' : 'Liste des factures'}
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              {viewMode === 'consolidated' ? consolidatedInvoices.length : invoices.length} element(s)
            </span>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <TableSkeleton rows={5} columns={4} />
            </div>
          ) : viewMode === 'consolidated' ? (
            consolidatedInvoices.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center text-slate-500">
                <Building2 className="mb-2 h-10 w-10 text-slate-300" />
                Aucune facture consolidee sur cette periode.
              </div>
            ) : (
              <div className="space-y-4">
                {consolidatedInvoices.map((invoice) => (
                  <div key={invoice.userId} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-700">
                          {invoice.user?.firstName} {invoice.user?.lastName} - {invoice.user?.email}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Periode: {invoice.period} | {invoice.paymentCount} paiement(s), {invoice.bookingCount} reservation(s)
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                          <p className="text-[11px] uppercase font-bold text-emerald-700">Paye</p>
                          <p className="text-sm font-bold text-emerald-800">{formatAmount(invoice.totalPaid)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
                          <p className="text-[11px] uppercase font-bold text-slate-600">Rembourse</p>
                          <p className="text-sm font-bold text-slate-800">{formatAmount(invoice.totalRefunded)}</p>
                        </div>
                        <div className="rounded-lg bg-cyan-50 px-3 py-2 text-center">
                          <p className="text-[11px] uppercase font-bold text-cyan-700">Net</p>
                          <p className="text-sm font-bold text-cyan-900">{formatAmount(invoice.netTotal)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadConsolidated(invoice.userId)}
                        disabled={downloadingId === invoice.userId}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        {downloadingId === invoice.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        PDF consolide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : invoices.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-slate-500">
              <Receipt className="mb-2 h-10 w-10 text-slate-300" />
              Aucune facture trouvee avec ces filtres.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">No</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Vehicule</th>
                    <th className="py-3 pr-4">Client</th>
                    <th className="py-3 pr-4">Montant</th>
                    <th className="py-3 pr-4">Methode</th>
                    <th className="py-3 pr-4">Statut</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4 font-bold text-slate-800">{invoice.invoiceNumber}</td>
                      <td className="py-3 pr-4 text-slate-600">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {invoice.booking?.vehicle?.brand} {invoice.booking?.vehicle?.model}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {invoice.user?.firstName} {invoice.user?.lastName}
                      </td>
                      <td className="py-3 pr-4 font-bold text-slate-900">{formatAmount(invoice.amount)}</td>
                      <td className="py-3 pr-4 text-slate-600">{invoice.paymentMethod}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[invoice.status] || 'bg-slate-100 text-slate-700'}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          disabled={downloadingId === invoice.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {downloadingId === invoice.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          {viewMode === 'consolidated' ? <Wallet className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
          {viewMode === 'consolidated'
            ? 'La consolidation B2B est calculee par client et par mois.'
            : 'Les recus sont generes a partir des paiements valides et restent disponibles.'}
        </div>
      </div>
    </div>
  );
}

export default InvoicesPage;
