import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Check, Trash2, MessageSquare } from "lucide-react";
import { reviewService } from "../../services/reviewService";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Skeleton } from "../../components/UI";
import ConfirmModal from "../../components/ConfirmModal";

function AdminReviews() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reviewId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") { navigate("/login"); return; }
    loadReviews();
  }, [isAuthenticated, user, navigate]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getAllReviews();
      setReviews(res.data || []);
    } catch (error) {
      console.error("Erreur chargement avis:", error);
      addToast("Erreur lors du chargement des avis", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await reviewService.approveReview(id);
      addToast(res?.message || "Avis approuve avec succes", "success");
      loadReviews();
    } catch (error) {
      console.error("Erreur approbation avis:", error);
      addToast(error.response?.data?.message || "Erreur lors de l approbation", "error");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, reviewId: id });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await reviewService.deleteReview(deleteModal.reviewId);
      addToast("Avis supprime avec succes", "success");
      setDeleteModal({ isOpen: false, reviewId: null });
      loadReviews();
    } catch (error) {
      console.error("Erreur suppression avis:", error);
      addToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "approved") return r.isApproved;
    if (filter === "pending") return !r.isApproved;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des avis</h1>
            <p className="text-gray-600">Moderez les avis clients</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (filter === f ? "bg-primary text-white" : "bg-white text-gray-600 border hover:bg-gray-50")}
            >
              {f === "all" ? "Tous (" + reviews.length + ")" : f === "pending" ? "En attente (" + reviews.filter((r) => !r.isApproved).length + ")" : "Approuves (" + reviews.filter((r) => r.isApproved).length + ")"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun avis dans cette categorie.</div>
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
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className={"ml-4 px-3 py-1 rounded-full text-sm font-semibold " + (review.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                        {review.isApproved ? "Approuve" : "En attente"}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-600 text-sm mb-1">Vehicule</p>
                      <p className="font-semibold">
                        {review.vehicle?.brand} {review.vehicle?.model} ({review.vehicle?.year})
                      </p>
                    </div>

                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={"w-5 h-5 " + (i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300")} />
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
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        title="Approuver"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(review.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, reviewId: null })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l avis"
        message="Etes-vous sur de vouloir supprimer cet avis ? Cette action est irreversible."
        loading={deleting}
      />
    </div>
  );
}

export default AdminReviews;