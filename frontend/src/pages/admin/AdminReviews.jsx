import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Star, Check, Trash2, MessageSquare } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { AuthContext } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/UI';
import ConfirmModal from '../../components/ConfirmModal';

function AdminReviews() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reviewId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadReviews();
  }, [isAuthenticated, user, navigate]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getAllReviews();
      // La réponse peut être { success, count, data } ou directement { data: [...] }
      const data = response?.data ?? response?.data ?? response ?? [];
      const items = Array.isArray(data) ? data : (data.data ?? data);
      setReviews(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const res = await reviewService.approveReview(reviewId);
      if (res?.message) alert(res.message);
      else alert('Avis approuvé avec succès');
      await loadReviews();
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleDeleteClick = (reviewId) => {
    setDeleteModal({ isOpen: true, reviewId });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await reviewService.deleteReview(deleteModal.reviewId);
      loadReviews();
      setDeleteModal({ isOpen: false, reviewId: null });
      alert('Avis supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'approved') return review.isApproved;
    if (filter === 'pending') return !review.isApproved;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}\n{/* Contenu */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Modération des avis</h1>
          <p className="text-gray-600">Approuvez ou supprimez les avis clients</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({reviews.filter(r => !r.isApproved).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvés ({reviews.filter(r => r.isApproved).length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {review.user.firstName} {review.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                        review.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.isApproved ? 'Approuvé' : 'En attente'}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-600 text-sm mb-1">Véhicule</p>
                      <p className="font-semibold">
                        {review.vehicle.brand} {review.vehicle.model} ({review.vehicle.year})
                      </p>
                    </div>

                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-600">({review.rating}/5)</span>
                    </div>

                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        title="Approuver"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(review.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, reviewId: null })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'avis"
        message="Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible."
        loading={deleting}
      />
    </div>
  );
}

export default AdminReviews;



