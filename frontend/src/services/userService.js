import api from './api';

export const userService = {
    // Soumettre les documents KYC
    submitKYC: async (formData) => {
        const response = await api.post('/users/kyc', formData);
        return response.data;
    },

    // Récupérer le profil utilisateur
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // Mettre à jour le profil
    updateProfile: async (data) => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    // Consentement cookies
    getCookieConsent: async () => {
        const response = await api.get('/users/cookie-consent');
        return response.data;
    },

    updateCookieConsent: async (payload) => {
        const response = await api.put('/users/cookie-consent', payload);
        return response.data;
    }
};

