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
  },

  // KYC
  getPendingKYC: async () => {
    const response = await api.get('/admin/kyc/pending');
    return response.data;
  },

  approveKYC: async (userId) => {
    const response = await api.put(`/admin/kyc/${userId}/approve`);
    return response.data;
  },

  rejectKYC: async (userId, reason) => {
    const response = await api.put(`/admin/kyc/${userId}/reject`, { reason });
    return response.data;
  },

  // Signalements messagerie
  getMessageReports: async (status = 'pending') => {
    const response = await api.get('/admin/message-reports', { params: { status } });
    return response.data;
  },

  reviewMessageReport: async (reportId, payload) => {
    const response = await api.put(`/admin/message-reports/${reportId}`, payload);
    return response.data;
  }
};
