import api from './api';

export const favoriteService = {
    // Basculer un favori (Ajouter/Retirer)
    toggleFavorite: async (vehicleId) => {
        const response = await api.post(`/favorites/${vehicleId}`);
        return response.data;
    },

    // Récupérer mes favoris
    getMyFavorites: async () => {
        const response = await api.get('/favorites');
        return response.data;
    },

    // Vérifier le statut d'un favori
    checkFavoriteStatus: async (vehicleId) => {
        const response = await api.get(`/favorites/check/${vehicleId}`);
        return response.data;
    }
};

