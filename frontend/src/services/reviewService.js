import api from './api';

export const reviewService = {
  // Créer un avis
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Récupérer les avis d'un véhicule
  getVehicleReviews: async (vehicleId) => {
    const response = await api.get(`/reviews/vehicle/${vehicleId}`);
    return response.data;
  },

  // Récupérer tous les avis (Admin)
  getAllReviews: async () => {
    const response = await api.get('/reviews');
    return response.data;
  },

  // Approuver un avis (Admin)
  approveReview: async (id) => {
    const response = await api.put(`/reviews/${id}/approve`);
    return response.data;
  },

  // Supprimer un avis (Admin)
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  }
};
