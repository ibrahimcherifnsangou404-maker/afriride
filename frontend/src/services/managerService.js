import api from './api';

export const managerService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/manager/dashboard');
    return response.data;
  },

  // Véhicules de l'agence
  getAgencyVehicles: async () => {
    const response = await api.get('/manager/vehicles');
    return response.data;
  },

  // Réservations de l'agence
  getAgencyBookings: async () => {
    const response = await api.get('/manager/bookings');
    return response.data;
  },

  // Récupérer les réservations avec filtres
  getBookingsFiltered: async (filters = {}) => {
    const response = await api.get('/manager/bookings', { params: filters });
    return response.data;
  },

  // Valider une réservation
  confirmBooking: async (bookingId) => {
    const response = await api.put(`/manager/bookings/${bookingId}/confirm`);
    return response.data;
  },

  // Refuser une réservation
  rejectBooking: async (bookingId, reason = '') => {
    const response = await api.put(`/manager/bookings/${bookingId}/reject`, { reason });
    return response.data;
  },

  // Exporter les réservations
  exportBookings: async (format = 'csv', filters = {}) => {
    const response = await api.get('/manager/bookings/export', {
      params: { format, ...filters },
      responseType: format === 'pdf' ? 'blob' : 'blob'
    });
    return response.data;
  },

  // Envoyer un message au client
  sendMessageToClient: async (bookingId, message) => {
    const response = await api.post(`/manager/bookings/${bookingId}/message`, { message });
    return response.data;
  },

  // Récupérer le détail d'une réservation
  getBookingDetail: async (bookingId) => {
    const response = await api.get(`/manager/bookings/${bookingId}`);
    return response.data;
  },

  // Marquer une réservation comme complétée
  completeBooking: async (bookingId) => {
    const response = await api.put(`/manager/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Workflow approbations
  getApprovals: async (status = 'pending') => {
    const response = await api.get('/manager/approvals', { params: { status } });
    return response.data;
  },

  approveRequest: async (approvalId, note = '') => {
    const response = await api.put(`/manager/approvals/${approvalId}/approve`, { note });
    return response.data;
  },

  rejectRequest: async (approvalId, note = '') => {
    const response = await api.put(`/manager/approvals/${approvalId}/reject`, { note });
    return response.data;
  },

  // Récupérer les notifications/tches du jour
  getTodaysTasks: async () => {
    const response = await api.get('/manager/tasks/today');
    return response.data;
  },

  // Récupérer les stats de revenus
  getRevenueStats: async (filters = {}) => {
    const response = await api.get('/manager/revenue', { params: filters });
    return response.data;
  },

};
