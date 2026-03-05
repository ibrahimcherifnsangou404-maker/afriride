import api from './api';

export const vehicleService = {
  // Récupérer tous les véhicules avec filtres
  getVehicles: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.agency) queryParams.append('agency', filters.agency);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.transmission) queryParams.append('transmission', filters.transmission);
    if (filters.fuelType) queryParams.append('fuelType', filters.fuelType);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const response = await api.get(`/vehicles?${queryParams.toString()}`);
    return response.data;
  },

  // Récupérer un véhicule par ID
  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Récupérer toutes les catégories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Récupérer toutes les agences
  getAgencies: async () => {
    const response = await api.get('/agencies');
    return response.data;
  },


  // Supprimer un véhicule
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  }
};
