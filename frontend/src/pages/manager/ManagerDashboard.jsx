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
const statusStyle = (s) => (s === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : s === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s === 'completed' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200');

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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="relative mx-auto max-w-7xl space-y-6 font-['Sora']">
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-2 pointer-events-none">{toasts.map((t) => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700"><Sparkles className="h-3.5 w-3.5" />Dashboard</div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Vue d'ensemble</h1>
              <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExport} disabled={isActionLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Download className="h-4 w-4" />Exporter</button>
              <button onClick={() => navigate('/manager/vehicles/add')} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">Nouveau vehicule</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Flotte</p><p className="mt-2 text-4xl font-black text-slate-900">{stats.totalVehicles || 0}</p><p className="text-sm text-slate-500">{stats.availableVehicles || 0} disponibles</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Reservations</p><p className="mt-2 text-4xl font-black text-slate-900">{bookings.length || 0}</p><p className="text-sm text-slate-500">{pendingCount} en attente</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Revenus</p><p className="mt-2 text-4xl font-black text-slate-900">{money(totalRevenue)}</p><p className="text-sm text-slate-500">mise a jour live</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Occupation</p><p className="mt-2 text-4xl font-black text-slate-900">{occupancyRate}%</p><p className="text-sm text-slate-500">performance agence</p></div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher reservation..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'pending', 'confirmed', 'completed'].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${statusFilter === status ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500'}`}>{status === 'all' ? 'Toutes' : statusLabel(status)}</button>)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-[0.14em] text-slate-400"><th className="px-6 py-4">Vehicule</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Periode</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400">Aucune reservation trouvee</td></tr> : paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{b.vehicle?.brand} {b.vehicle?.model}</td>
                      <td className="px-6 py-4 text-slate-700">{b.user?.firstName} {b.user?.lastName}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(b.startDate).toLocaleDateString('fr-FR')} au {new Date(b.endDate).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(b.status)}`}>{statusLabel(b.status)}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedBooking(b); setIsDetailsModalOpen(true); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openClientConversation(b)} className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100"><MessageCircle className="h-4 w-4" /></button>
                        {b.status === 'pending' ? <>
                          <button onClick={() => updateBookingStatus(b.id, 'confirm')} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => updateBookingStatus(b.id, 'reject')} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><XCircle className="h-4 w-4" /></button>
                        </> : null}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings.length > itemsPerPage ? <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Precedent</button><span>Page {currentPage}/{totalPages}</span><button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button></div> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-900 p-5">
              <h3 className="text-lg font-black text-white">Actions rapides</h3>
              <div className="mt-4 space-y-3">
                <button onClick={() => (user?.role === 'admin' ? navigate('/admin/kyc') : navigate('/manager/kyc'))} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left"><ShieldCheck className="h-5 w-5 text-amber-500" /><div><p className="text-sm font-bold text-slate-900">Identites a verifier</p><p className="text-xs text-slate-500">{pendingCount} en attente</p></div></button>
                <button onClick={() => navigate('/manager/bookings')} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left"><Clock className="h-5 w-5 text-indigo-500" /><div><p className="text-sm font-bold text-slate-900">Planning reservations</p><p className="text-xs text-slate-500">gerer les disponibilites</p></div></button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Votre agence</p><p className="mt-2 text-xl font-black text-slate-900">AfriRide Yaounde</p><p className="text-sm text-slate-500">ID: {user?.agencyId?.split('-')?.[0] || '...'}</p></div>
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
