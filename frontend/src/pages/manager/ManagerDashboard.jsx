import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Download, Search, Eye, MessageCircle, CheckCircle, XCircle, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import { managerService } from '../../services/managerService';
import { AuthContext } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { PageSkeleton } from '../../components/UI';

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;

const statusLabel = (s) => (s === 'pending' ? 'En attente' : s === 'confirmed' ? 'Validee' : s === 'completed' ? 'Terminee' : 'Annulee');
const statusStyle = (s) => (s === 'pending' ? 'bg-amber-400/15 text-amber-200 border-amber-300/30' : s === 'confirmed' ? 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30' : s === 'completed' ? 'bg-cyan-400/15 text-cyan-100 border-cyan-300/30' : 'bg-rose-400/15 text-rose-200 border-rose-300/30');

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await managerService.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        addToast(`Erreur: ${err.response?.data?.message || err.message || 'Inconnue'}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isAuthenticated, user, navigate, addToast]);

  const handleExport = async () => {
    try {
      setIsActionLoading(true);
      const data = await managerService.exportBookings('csv', { status: statusFilter !== 'all' ? statusFilter : undefined });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast('Export reussi', 'success');
    } catch {
      addToast("Erreur lors de l'export", 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, action) => {
    if (!window.confirm(`Voulez-vous ${action === 'confirm' ? 'confirmer' : 'refuser'} cette reservation ?`)) return;
    try {
      setIsActionLoading(true);
      if (action === 'confirm') await managerService.confirmBooking(bookingId);
      else await managerService.rejectBooking(bookingId, 'Refuse par le gestionnaire');
      addToast('Reservation mise a jour', 'success');
      const response = await managerService.getDashboard();
      setDashboardData(response.data);
    } catch {
      addToast("Erreur lors de l'action", 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openClientConversation = (booking) => {
    const participantId = booking?.user?.id;
    if (!participantId) return addToast('Client introuvable', 'error');
    const vehicleLabel = [booking?.vehicle?.brand, booking?.vehicle?.model].filter(Boolean).join(' ').trim();
    const prefill = `Bonjour ${booking?.user?.firstName || ''}, je vous contacte au sujet de votre reservation${vehicleLabel ? ` (${vehicleLabel})` : ''}.`;
    navigate(`/messages?${new URLSearchParams({ participantId, bookingId: booking?.id || '', prefill }).toString()}`);
  };

  const stats = dashboardData?.stats || {};
  const bookings = Array.isArray(dashboardData?.recentBookings) ? dashboardData.recentBookings : [];
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const occupancyRate = stats.totalVehicles > 0 ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) : 0;
  const totalRevenue = stats.totalRevenue || bookings.reduce((sum, b) => sum + Number(b?.totalPrice || 0), 0);

  const filteredBookings = bookings.filter((b) => {
    if (!b || typeof b !== 'object') return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (b.vehicle?.brand?.toLowerCase() || '').includes(q) || (b.vehicle?.model?.toLowerCase() || '').includes(q) || (b.user?.firstName?.toLowerCase() || '').includes(q) || (b.user?.lastName?.toLowerCase() || '').includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter]);
  if (loading) return <PageSkeleton variant="dashboard" />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b1f] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_72%_86%,rgba(16,185,129,0.12),transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6 font-['Sora']">
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-2 pointer-events-none">{toasts.map((t) => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

        <section className="rounded-[2rem] border border-white/15 bg-slate-900/65 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" />Command Center</div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Tableau de bord ultra dynamique</h1>
              <p className="text-sm font-medium text-slate-300">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExport} disabled={isActionLoading} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"><Download className="h-4 w-4" />Exporter</button>
              <button onClick={() => navigate('/manager/add-vehicle')} className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-sm font-black text-slate-950">Nouveau vehicule</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 text-white"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Flotte</p><p className="mt-2 text-4xl font-black">{stats.totalVehicles || 0}</p><p className="text-sm text-slate-300">{stats.availableVehicles || 0} disponibles</p></div>
          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 text-white"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Reservations</p><p className="mt-2 text-4xl font-black">{bookings.length || 0}</p><p className="text-sm text-slate-300">{pendingCount} en attente</p></div>
          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 text-white"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Revenus</p><p className="mt-2 text-4xl font-black">{money(totalRevenue)}</p><p className="text-sm text-slate-300">mise a jour live</p></div>
          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 text-white"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Occupation</p><p className="mt-2 text-4xl font-black">{occupancyRate}%</p><p className="text-sm text-slate-300">performance agence</p></div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-900/70">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher reservation..." className="w-full rounded-xl border border-white/15 bg-slate-950/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'pending', 'confirmed', 'completed'].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${statusFilter === status ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950' : 'border border-white/15 bg-white/5 text-slate-300'}`}>{status === 'all' ? 'Toutes' : statusLabel(status)}</button>)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.14em] text-slate-400"><th className="px-6 py-4">Vehicule</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Periode</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedBookings.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400">Aucune reservation trouvee</td></tr> : paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.03]">
                      <td className="px-6 py-4 text-white">{b.vehicle?.brand} {b.vehicle?.model}</td>
                      <td className="px-6 py-4 text-slate-200">{b.user?.firstName} {b.user?.lastName}</td>
                      <td className="px-6 py-4 text-slate-300">{new Date(b.startDate).toLocaleDateString('fr-FR')} au {new Date(b.endDate).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(b.status)}`}>{statusLabel(b.status)}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedBooking(b); setIsDetailsModalOpen(true); }} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openClientConversation(b)} className="rounded-lg border border-cyan-300/20 bg-cyan-400/15 p-2 text-cyan-100"><MessageCircle className="h-4 w-4" /></button>
                        {b.status === 'pending' ? <>
                          <button onClick={() => updateBookingStatus(b.id, 'confirm')} className="rounded-lg border border-emerald-300/20 bg-emerald-400/15 p-2 text-emerald-100"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => updateBookingStatus(b.id, 'reject')} className="rounded-lg border border-rose-300/20 bg-rose-400/15 p-2 text-rose-100"><XCircle className="h-4 w-4" /></button>
                        </> : null}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings.length > itemsPerPage ? <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-300"><button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Precedent</button><span>Page {currentPage}/{totalPages}</span><button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button></div> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5">
              <h3 className="text-lg font-black text-white">Actions rapides</h3>
              <div className="mt-4 space-y-3">
                <button onClick={() => (user?.role === 'admin' ? navigate('/admin/kyc') : navigate('/manager/kyc'))} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left"><ShieldCheck className="h-5 w-5 text-amber-200" /><div><p className="text-sm font-bold text-white">Identites a verifier</p><p className="text-xs text-slate-300">{pendingCount} en attente</p></div></button>
                <button onClick={() => navigate('/manager/bookings')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left"><Clock className="h-5 w-5 text-indigo-200" /><div><p className="text-sm font-bold text-white">Planning reservations</p><p className="text-xs text-slate-300">gerer les disponibilites</p></div></button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-slate-900/70 p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Votre agence</p><p className="mt-2 text-xl font-black text-white">AfriRide Yaounde</p><p className="text-sm text-slate-300">ID: {user?.agencyId?.split('-')?.[0] || '...'}</p></div>
          </div>
        </section>
      </div>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Details de la reservation" size="lg">
        {selectedBooking ? <div className="space-y-2"><p><strong>Vehicule:</strong> {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}</p><p><strong>Client:</strong> {selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p><p><strong>Periode:</strong> {new Date(selectedBooking.startDate).toLocaleDateString('fr-FR')} au {new Date(selectedBooking.endDate).toLocaleDateString('fr-FR')}</p><p><strong>Total:</strong> {money(selectedBooking.totalPrice)}</p></div> : null}
      </Modal>
    </div>
  );
}

export default ManagerDashboard;
