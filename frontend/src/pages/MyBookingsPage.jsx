import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, Calendar, MapPin, Clock, XCircle, CheckCircle, AlertCircle, Star,
  ChevronRight, Filter, Download, Eye, TrendingUp, Zap, Truck, CreditCard
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import BookingContracts from '../components/BookingContracts';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, Badge, EmptyState, TableSkeleton } from '../components/UI';
import { API_BASE_URL } from '../services/api';


function MyBookingsPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadBookings();
    window.scrollTo(0, 0);
  }, [isAuthenticated, navigate]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      if (response && Array.isArray(response.data)) {
        // Trier par date décroissante (plus récent en premier)
        const sorted = [...response.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(sorted);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'active') return bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));
    if (activeTab === 'completed') return bookings.filter(b => b.status === 'completed');
    if (activeTab === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings;
  };

  const filteredBookings = getFilteredBookings();

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
      case 'confirmed':
        return { label: 'Confirmée', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle };
      case 'in_progress':
        return { label: 'En cours', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Truck };
      case 'completed':
        return { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Annulée', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const previewResponse = await bookingService.getCancellationPreview(bookingId);
      const preview = previewResponse?.data;
      const refundRatePct = Math.round((Number(preview?.refundRate || 0)) * 100);
      const refundAmount = Number(preview?.refundAmount || 0);
      const policyReason = preview?.policyReason || 'Politique standard';
      const confirmMessage = [
        'Confirmer l annulation de cette reservation ?',
        '',
        `Politique: ${policyReason}`,
        `Remboursement: ${refundRatePct}% (${refundAmount.toLocaleString('fr-FR')} FCFA)`
      ].join('\n');
      if (!window.confirm(confirmMessage)) return;

      const reason = window.prompt('Raison d annulation (obligatoire, 5 caracteres minimum):', '');
      if (!reason || reason.trim().length < 5) {
        addToast('Veuillez renseigner une raison valide (minimum 5 caracteres)', 'warning');
        return;
      }

      const response = await bookingService.cancelBooking(bookingId, { reason: reason.trim() });
      if (response.success) {
        const cancellation = response?.data?.cancellation;
        if (cancellation) {
          const refunded = Number(cancellation.refundAmount || 0).toLocaleString('fr-FR');
          addToast(`Reservation annulee. Remboursement applique: ${refunded} FCFA`, 'success');
        }
        loadBookings();
      }
    } catch (error) {
      console.error('Erreur annulation réservation:', error);
      addToast(error.response?.data?.message || 'Erreur lors de l annulation', 'error');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const response = await reviewService.createReview({
        bookingId: selectedBooking.id,
        vehicleId: selectedBooking.vehicle.id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      if (response.success) {
        setShowReviewModal(false);
        loadBookings();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    spent: bookings.filter(b => b.status !== 'cancelled').reduce((acc, curr) => acc + parseFloat(curr.totalPrice || 0), 0)
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const getLatestApproval = (booking) => {
    const approvals = booking?.approvals || [];
    if (!approvals.length) return null;
    return [...approvals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const handleRequestApproval = async (bookingId) => {
    try {
      const response = await bookingService.requestApproval(bookingId);
      if (response.success) {
        loadBookings();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur lors de la demande d approbation', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Header Dashboard */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 shadow-sm">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mon Tableau de Bord</h1>
          <p className="text-slate-500">Gérez vos locations et retrouvez votre historique complet.</p>

          {/* Stats Cards Desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.active}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">En cours</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.completed}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Terminées</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">{(stats.spent / 1000).toFixed(0)}k</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dépensé</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-6">

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 no-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'active', label: 'En cours' },
            { id: 'completed', label: 'Terminées' },
            { id: 'cancelled', label: 'Annulées' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Liste des réservations */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              const StatusIcon = statusInfo.icon;
              const latestApproval = getLatestApproval(booking);

              if (!booking.vehicle) return null; // Sécurité

              return (
                <div key={booking.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="flex flex-col md:flex-row">

                    {/* Image Section */}
                    <div className="md:w-72 bg-slate-100 relative overflow-hidden h-48 md:h-auto">
                      {booking.vehicle.images?.[0] ? (
                        <img
                          src={getImageUrl(booking.vehicle.images[0])}
                          alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Car className="w-12 h-12" />
                        </div>
                      )}

                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} backdrop-blur-md`}>
                          <StatusIcon className="w-3 h-3 mr-1.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                            {booking.vehicle.brand} {booking.vehicle.model}
                          </h3>
                          <p className="text-slate-500 text-sm flex items-center">
                            {booking.vehicle.year} | {booking.vehicle.agency?.name}
                          </p>
                        </div>

                        

                        <div className="text-left md:text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-lg font-black text-slate-900">{parseFloat(booking.totalPrice).toLocaleString()} FCFA</p>
                        </div>
                      </div>

                      {/* Timeline Dates */}
                      <div className="flex items-center gap-4 mb-6 text-sm">
                        <div className="flex items-center text-slate-700 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          {new Date(booking.startDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="w-8 h-px bg-slate-300"></div>
                        <div className="flex items-center text-slate-700 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-2">
                          {booking.totalDays} Jours
                        </span>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <Link to={`/vehicles/${booking.vehicle.id}`} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center">
                          Voir le véhicule <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
                          {booking.status === 'pending' && !latestApproval && (
                            <Button variant="secondary" size="sm" onClick={() => handleRequestApproval(booking.id)} className="flex-1 sm:flex-none">
                              Demander approbation
                            </Button>
                          )}

                          {booking.status === 'pending' && latestApproval?.status === 'pending' && (
                            <Badge variant="warning" size="sm">Approbation en attente</Badge>
                          )}

                          {latestApproval?.status === 'approved' && (
                            <Badge variant="success" size="sm">Approuvée</Badge>
                          )}

                          {latestApproval?.status === 'rejected' && (
                            <Badge variant="danger" size="sm">Rejetée</Badge>
                          )}

                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)} className="flex-1 sm:flex-none text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200">
                              Annuler
                            </Button>
                          )}

                          {booking.status === 'completed' && !booking.review && (
                            <Button size="sm" onClick={() => { setSelectedBooking(booking); setShowReviewModal(true); }} className="flex-1 sm:flex-none">
                              <Star className="w-4 h-4 mr-2" />
                              Noter
                            </Button>
                          )}

                          {/* Devis / Contrat */}
                          {booking.status !== 'cancelled' && (
                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                <BookingContracts bookingId={booking.id} bookingStatus={booking.status} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 transform scale-100 transition-all">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Notez votre expérience</h3>
            <p className="text-slate-500 mb-6">Comment s'est passée votre location avec {selectedBooking?.vehicle?.brand} {selectedBooking?.vehicle?.model} ?</p>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewData({ ...reviewData, rating: star })} className="transition-transform hover:scale-110 focus:outline-none">
                  <Star className={`w-10 h-10 ${star <= reviewData.rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>

            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 mb-6 resize-none"
              rows="4"
              placeholder="Dites-nous en plus..."
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowReviewModal(false)}>Annuler</Button>
              <Button className="flex-1" onClick={handleSubmitReview}>Envoyer</Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default MyBookingsPage;


