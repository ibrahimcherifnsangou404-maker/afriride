import api from './api';

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Agences
  getAllAgencies: async () => {
    const response = await api.get('/admin/agencies');
    return response.data;
  },

  createAgency: async (agencyData) => {
    const response = await api.post('/admin/agencies', agencyData);
    return response.data;
  },

  updateAgency: async (id, agencyData) => {
    const response = await api.put(`/admin/agencies/${id}`, agencyData);
    return response.data;
  },

  deleteAgency: async (id) => {
    const response = await api.delete(`/admin/agencies/${id}`);
    return response.data;
  },

  // Catégories
  getAllCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Utilisateurs
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  }
};
