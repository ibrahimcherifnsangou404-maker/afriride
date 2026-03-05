import api from './api';

export const userService = {
    // Soumettre les documents KYC
    submitKYC: async (formData) => {
        return await api.post('/users/kyc', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
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
    }
};

