import api from './api';

export const agencyService = {
  // Inscription partenaire (Agence + Manager)
  partnerSignup: async (payload) => {
    const response = await api.post('/agencies/partner-signup', payload);
    return response.data;
  },

  // Créer une agence (partenaire - Public)
  createAgency: async (agencyData) => {
    const response = await api.post('/agencies/register', agencyData);
    return response.data;
  },

  // Créer un compte manager
  createManager: async (managerData) => {
    const response = await api.post('/manager/register', managerData);
    return response.data;
  },

  // Récupérer toutes les agences
  getAllAgencies: async () => {
    const response = await api.get('/agencies');
    return response.data;
  },

  // Récupérer une agence par ID
  getAgencyById: async (id) => {
    const response = await api.get(`/agencies/${id}`);
    return response.data;
  },

  // Mettre à jour une agence
  updateAgency: async (id, agencyData) => {
    const response = await api.put(`/agencies/${id}`, agencyData);
    return response.data;
  },

  // Supprimer une agence
  deleteAgency: async (id) => {
    const response = await api.delete(`/agencies/${id}`);
    return response.data;
  }
};

