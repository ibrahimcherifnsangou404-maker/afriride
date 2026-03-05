import api from './api';

export const loyaltyService = {
  // Récupérer mes points et historique
  getMyPoints: async () => {
    const response = await api.get('/loyalty/my-points');
    return response.data;
  },

  // Utiliser des points pour obtenir une réduction
  redeemPoints: async (pointsToRedeem) => {
    const response = await api.post('/loyalty/redeem', { pointsToRedeem });
    return response.data;
  },

  // Ajouter des points à un utilisateur (Admin)
  addPoints: async (userId, points, reason, bookingId = null) => {
    const response = await api.post('/loyalty/add', {
      userId,
      points,
      reason,
      bookingId
    });
    return response.data;
  },

  // Récupérer tous les utilisateurs avec leurs points (Admin)
  getAllUsersPoints: async () => {
    const response = await api.get('/loyalty/users');
    return response.data;
  }
};
