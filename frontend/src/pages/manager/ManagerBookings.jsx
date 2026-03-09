import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Calendar, Phone, Mail, CheckCircle, XCircle,
  Search, ArrowRight
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { contractService } from '../../services/contractService';
import { AuthContext } from '../../context/AuthContext';
import { Toast } from '../../components/Toast';
import { API_BASE_URL } from '../../services/api';

export default function ManagerBookings() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const [contractLoadingByBooking, setContractLoadingByBooking] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const addToast = (message, type = 'info') => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await managerService.getAgencyBookings({
        status: filter,
        q: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit
      });

      setBookings(response.data || []);
      setPagination(response.pagination || {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: (response.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: pagination.page > 1
      });
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      addToast('Erreur lors du chargement des réservations', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, pagination.page, pagination.limit]);

  const loadApprovals = useCallback(async () => {
    try {
      const response = await managerService.getApprovals('pending');
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Erreur chargement approbations:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }
    loadApprovals();
  }, [isAuthenticated, user, navigate, loadApprovals]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filter, debouncedSearch]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      return;
    }
    loadBookings();
  }, [isAuthenticated, user, loadBookings]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Confirmer le changement de statut vers "${newStatus}" ?`)) return;
    try {
      const response =
        newStatus === 'confirmed'
          ? await managerService.confirmBooking(bookingId)
          : newStatus === 'completed'
            ? await managerService.completeBooking(bookingId)
            : await managerService.rejectBooking(bookingId);

      if (response.success) {
        addToast('Statut mis à jour avec succès', 'success');
        loadBookings();
      }
    } catch (error) {
      addToast(error?.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleOpenContract = async (bookingId) => {
    try {
      setContractLoadingByBooking((prev) => ({ ...prev, [bookingId]: true }));
      const response = await contractService.getContractsByBooking(bookingId);
      const contracts = response?.data?.data || [];

      if (!contracts.length) {
        addToast('Aucun contrat trouvé pour cette réservation', 'error');
        return;
      }

      navigate(`/contracts/${contracts[0].id}`);
    } catch (error) {
      console.error('Erreur ouverture contrat:', error);
      addToast('Impossible de charger le contrat', 'error');
    } finally {
      setContractLoadingByBooking((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleApprovalAction = async (approvalId, action) => {
    const note = window.prompt(action === 'approve' ? 'Note (optionnelle) approbation:' : 'Motif de rejet (optionnel):') || '';
    try {
      if (action === 'approve') {
        await managerService.approveRequest(approvalId, note);
      } else {
        await managerService.rejectRequest(approvalId, note);
      }
      addToast('Demande traitée avec succès', 'success');
      loadApprovals();
      loadBookings();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Erreur lors du traitement', 'error');
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Réservations</h1>
            <p className="text-slate-500 font-medium">Gérez et suivez toutes les locations ({pagination.totalItems})</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {['all', 'pending', 'confirmed', 'in_progress'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === status
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {status === 'all' ? 'Toutes' : status === 'pending' ? 'En attente' : status === 'confirmed' ? 'Confirmées' : 'En cours'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client, un véhicule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm text-sm font-medium"
          />
        </div>

        {approvals.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Demandes d approbation en attente ({approvals.length})</h3>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {approval.booking?.vehicle?.brand} {approval.booking?.vehicle?.model} - {parseFloat(approval.booking?.totalPrice || 0).toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-slate-600">
                      Client: {approval.requester?.firstName} {approval.requester?.lastName} ({approval.requester?.email})
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Du {new Date(approval.booking?.startDate).toLocaleDateString()} au {new Date(approval.booking?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovalAction(approval.id, 'approve')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">Approuver</button>
                    <button onClick={() => handleApprovalAction(approval.id, 'reject')} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700">Rejeter</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Chargement des réservations...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-slate-500">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-1px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex gap-4 min-w-[300px]">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {booking.vehicle?.images?.[0] ? (
                        <img src={`${API_BASE_URL}${booking.vehicle.images[0]}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Car className="w-8 h-8" /></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{booking.vehicle?.brand} {booking.vehicle?.model}</h3>
                      <p className="text-slate-500 text-sm font-medium">{booking.vehicle?.year} | {booking.totalDays} jours</p>
                    </div>
                  </div>

                  <div className="flex-1 border-l border-slate-100 pl-6 hidden lg:block">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {booking.user?.firstName?.[0]}
                      </div>
                      <span className="font-bold text-slate-700">{booking.user?.firstName} {booking.user?.lastName}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {booking.user?.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {booking.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 min-w-[200px]">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase">Période</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(booking.startDate).toLocaleDateString()}
                        <ArrowRight className="inline w-3 h-3 mx-1 text-slate-300" />
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">{parseFloat(booking.totalPrice).toLocaleString()} <span className="text-xs text-emerald-600/60 font-medium">FCFA</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      onClick={() => handleOpenContract(booking.id)}
                      disabled={!!contractLoadingByBooking[booking.id]}
                      className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-bold text-sm px-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {contractLoadingByBooking[booking.id] ? 'Chargement...' : 'Voir contrat'}
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(booking.id, 'confirmed')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-bold flex items-center gap-2 text-sm px-4">
                          <CheckCircle className="w-4 h-4" /> Valider
                        </button>
                        <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Refuser">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                      <button onClick={() => handleUpdateStatus(booking.id, 'completed')} className="p-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-bold flex items-center gap-2 text-sm px-4">
                        <CheckCircle className="w-4 h-4" /> Terminer
                      </button>
                    )}
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' :
                          booking.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                            'bg-red-100 text-red-700'
                      }`}>
                      {booking.status === 'pending' ? 'En attente' :
                        booking.status === 'confirmed' ? 'Confirmée' :
                          booking.status === 'in_progress' ? 'En cours' :
                            booking.status === 'completed' ? 'Terminée' : 'Annulée'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm font-semibold text-slate-700">Page {pagination.page} / {pagination.totalPages}</span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
