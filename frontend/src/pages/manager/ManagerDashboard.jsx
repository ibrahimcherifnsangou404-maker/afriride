import { useState, useEffect, useContext, useCallback, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, XCircle,
  BarChart3, TrendingUp, Download, Eye,
  MessageCircle, ChevronRight, AlertCircle,
  Search, Filter, Users, Car, Wallet, ArrowUpRight
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { AuthContext } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { PageSkeleton } from '../../components/UI';

// --- VISUAL COMPONENTS ---

const StatCard = ({ title, value, subtext, icon, trend, color, onClick }) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 ring-blue-500/20",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-500/20",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-500/20",
    amber: "bg-amber-50 text-amber-600 ring-amber-500/20",
  };
  const activeStyle = colorStyles[color] || colorStyles.blue;
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group text-left w-full ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ring-1 ${activeStyle} transition-colors`}>
          {createElement(icon, { className: "w-6 h-6" })}
        </div>
        {trend && (
          <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-bold text-green-700">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:scale-105 transition-transform origin-left">
          {value}
        </h3>
        {subtext && <p className="text-sm text-slate-400 mt-1 font-medium">{subtext}</p>}
      </div>
      {/* Decoration */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 ${activeStyle.split(' ')[0]} blur-2xl group-hover:opacity-10 transition-opacity`} />
    </Component>
  );
};

const QuickActionRow = ({ icon, title, subtitle, onClick, color = "blue", count }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group text-left"
  >
    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
      {createElement(icon, { className: "w-5 h-5" })}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-slate-800 truncate">{title}</h4>
      <p className="text-sm text-slate-500 truncate">{subtitle}</p>
    </div>
    {count > 0 && (
      <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
        {count}
      </span>
    )}
    <div className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
      <ArrowUpRight className="w-5 h-5" />
    </div>
  </button>
);

// --- MAIN COMPONENT ---

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  // STABLE LOADING LOGIC
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      console.log('Chargement dashboard...');
      try {
        setLoading(true);
        const response = await managerService.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        console.error('ùå Erreur:', err);
        const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
        addToast('Erreur: ' + msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isAuthenticated, user, navigate, addToast]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await managerService.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      addToast(err.message || 'Erreur chargement dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ACTIONS
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
      addToast('Export rÈussi', 'success');
    } catch {
      addToast('Erreur lors de l\'export', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      setIsActionLoading(true);
      await managerService.sendMessageToClient(selectedBooking.id, messageText);
      addToast('Message envoyÈ', 'success');
      setIsMessageModalOpen(false);
      setMessageText('');
    } catch {
      addToast('Erreur envoi message', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, action) => {
    if (!window.confirm(`Voulez-vous ${action === 'confirm' ? 'confirmer' : 'refuser'} cette rÈservation ?`)) return;

    try {
      setIsActionLoading(true);
      if (action === 'confirm') await managerService.confirmBooking(bookingId);
      else await managerService.rejectBooking(bookingId, 'RefusÈ par le gestionnaire');

      addToast(`Action effectuÈe: ${action}`, 'success');
      loadDashboard();
    } catch {
      addToast('Erreur lors de l\'action', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // DATA PROCESSING
  const stats = dashboardData?.stats || {};
  const bookings = Array.isArray(dashboardData?.recentBookings) ? dashboardData.recentBookings : [];

  const filteredBookings = bookings.filter(b => {
    if (!b || typeof b !== 'object') return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (b.vehicle?.brand?.toLowerCase() || '').includes(q) ||
        (b.user?.firstName?.toLowerCase() || '').includes(q)
      );
    }
    return true;
  });

  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const occupancyRate = stats.totalVehicles > 0 ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100) : 0;

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast Container */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto shadow-2xl">
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Vue d'ensemble
            </h1>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span className="bg-white px-2 py-1 rounded-md border border-slate-200 text-xs uppercase tracking-wider">
                {user?.role === 'admin' ? 'Administrateur' : 'Manager'}
              </span>
              <span>|</span>
              <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isActionLoading}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2">
              <span>Nouveau vÈhicule</span>
            </button>
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* STATS CARDS */}
          <StatCard
            title="Flotte Totale"
            value={stats.totalVehicles || 0}
            subtext={`${stats.availableVehicles || 0} disponibles`}
            icon={Car}
            color="emerald"
            onClick={() => navigate('/manager/vehicles')}
          />
          <StatCard
            title="RÈservations"
            value={bookings.length || 0}
            subtext={`${pendingCount} en attente`}
            icon={Calendar}
            trend="+12%"
            color="indigo"
            onClick={() => navigate('/manager/bookings')}
          />
          <StatCard
            title="Revenus (Est.)"
            value="450k"
            subtext="FCFA ce mois"
            icon={Wallet}
            trend="+8%"
            color="blue"
            onClick={() => navigate('/manager/revenue')}
          />
          <StatCard
            title="Taux Occup."
            value={`${occupancyRate}%`}
            subtext="Performance moyenne"
            icon={BarChart3}
            color="amber"
          />

          {/* MAIN CONTENT AREA: TABLE & QUICK ACTIONS */}
          <div className="lg:col-span-3 space-y-6">

            {/* TABLE CARD */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-1px_rgba(0,0,0,0.02)] overflow-hidden">
              {/* Toolbar */}
              <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher une rÈservation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow text-sm font-medium"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  {['all', 'pending', 'confirmed', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === status
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'bg-white text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200'
                        }`}
                    >
                      {status === 'all' ? 'Toutes' :
                        status === 'pending' ? 'En attente' :
                          status === 'confirmed' ? 'ConfirmÈes' : 'TerminÈes'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30 text-left">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">VÈh vÈhicule</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">PÈriode</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                          Aucune rÈservation trouvÈe
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.map((booking) => (
                        <tr key={booking.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                <Car className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-700">{booking.vehicle?.brand} {booking.vehicle?.model}</p>
                                <p className="text-xs text-slate-400 font-medium">{booking.vehicle?.licensePlate || 'Sans plaque'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                {booking.user?.firstName?.[0] || 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 truncate max-w-[120px]">
                                  {booking.user?.firstName} {booking.user?.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-600">
                              {new Date(booking.startDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              Üí {new Date(booking.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${booking.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                booking.status === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                  'bg-red-50 text-red-600 border-red-100'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${booking.status === 'pending' ? 'bg-amber-500' :
                                booking.status === 'confirmed' ? 'bg-emerald-500' :
                                  booking.status === 'completed' ? 'bg-slate-500' : 'bg-red-500'
                                }`} />
                              {booking.status === 'pending' ? 'En attente' :
                                booking.status === 'confirmed' ? 'ValidÈe' :
                                  booking.status === 'completed' ? 'TerminÈe' : 'AnnulÈe'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setSelectedBooking(booking); setIsDetailsModalOpen(true); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir dÈtails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedBooking(booking); setIsMessageModalOpen(true); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Message"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'confirm')}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Accepter"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'reject')}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Refuser"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBookings.length > itemsPerPage && (
                <div className="p-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-sm font-bold text-slate-500 disabled:opacity-30 hover:text-blue-600 transition-colors"
                  >
                    Üê PrÈcÈdent
                  </button>
                  <span className="text-xs font-medium text-slate-400">Page {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredBookings.length / itemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredBookings.length / itemsPerPage)}
                    className="text-sm font-bold text-slate-500 disabled:opacity-30 hover:text-blue-600 transition-colors"
                  >
                    Suivant Üí
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-6">

            {/* Action Widget */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40 mix-blend-screen" />
              <h3 className="text-lg font-bold mb-4 relative z-10">Actions Rapides</h3>
              <div className="space-y-3 relative z-10">
                <QuickActionRow
                  icon={Users}
                  title="IdentitÈs ‡ vÈrifier"
                  subtitle="Validation documents KYC"
                  count={pendingCount} // Assuming we can use this or similar
                  onClick={() => user?.role === 'admin' && navigate('/admin/kyc')}
                  color="amber"
                />
                <QuickActionRow
                  icon={Clock}
                  title="RÈservations"
                  subtitle="GÈrer le planning"
                  onClick={() => navigate('/manager/bookings')}
                  color="blue"
                />
              </div>
            </div>

            {/* Profile/Agency Widget */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Votre Agence</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                  A
                </div>
                <div>
                  <p className="font-bold text-slate-800">AfriRide YaoundÈ</p>
                  <p className="text-xs text-slate-400 font-medium">ID: {user?.agencyId?.split('-')?.[0] || '...'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Performance</span>
                  <span className="text-green-600 font-bold">Excellent</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="DÈtails de la rÈservation"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6 p-2">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">VÈhicule</p>
                <p className="text-lg font-bold text-slate-800">{selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}</p>
                <p className="text-sm text-slate-500">{selectedBooking.vehicle?.year} | {selectedBooking.vehicle?.licensePlate}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Client</p>
                <p className="text-lg font-bold text-slate-800">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                <p className="text-sm text-slate-500">{selectedBooking.user?.phone}</p>
                <p className="text-sm text-slate-500">{selectedBooking.user?.email}</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase mb-1">PÈriode</p>
                <p className="text-base font-bold text-indigo-900">
                  {new Date(selectedBooking.startDate).toLocaleDateString()}
                  <span className="mx-2 text-indigo-300">ûî</span>
                  {new Date(selectedBooking.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Total</p>
                <p className="text-2xl font-black text-emerald-700">
                  {parseFloat(selectedBooking.totalPrice).toLocaleString()} <span className="text-sm font-medium text-emerald-600/60">FCFA</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title="Envoyer un message"
      >
        <div className="space-y-4">
          <textarea
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none text-slate-700 placeholder:text-slate-400 bg-slate-50"
            placeholder="…crivez votre message au client..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsMessageModalOpen(false)}
              className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isActionLoading || !messageText.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Envoyer
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default ManagerDashboard;








