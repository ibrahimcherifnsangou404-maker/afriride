import api from './api';

export const promoCodeService = {
  // Valider un code promo
  validatePromoCode: async (code, totalAmount) => {
    const response = await api.post('/promo-codes/validate', {
      code,
      totalAmount
    });
    return response.data;
  },

  // Créer un code promo (Admin)
  createPromoCode: async (promoCodeData) => {
    const response = await api.post('/promo-codes', promoCodeData);
    return response.data;
  },

  // Récupérer tous les codes promo (Admin)
  getAllPromoCodes: async () => {
    const response = await api.get('/promo-codes');
    return response.data;
  },

  // Mettre à jour un code promo (Admin)
  updatePromoCode: async (id, updates) => {
    const response = await api.put(`/promo-codes/${id}`, updates);
    return response.data;
  },

  // Supprimer un code promo (Admin)
  deletePromoCode: async (id) => {
    const response = await api.delete(`/promo-codes/${id}`);
    return response.data;
  },

  // Récupérer l'historique d'utilisation d'un code promo (Admin)
  getPromoCodeUsages: async (id) => {
    const response = await api.get(`/promo-codes/${id}/usages`);
    return response.data;
  }
};
