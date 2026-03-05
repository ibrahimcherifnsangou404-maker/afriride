import api from './api';

export const bookingService = {
  // Verifier la disponibilite d'un vehicule pour une plage de dates
  checkAvailability: async ({ vehicleId, startDate, endDate }) => {
    const response = await api.get('/bookings/availability', {
      params: { vehicleId, startDate, endDate }
    });
    return response.data;
  },

  // Créer une réservation
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Demander une approbation manager pour une reservation
  requestApproval: async (bookingId, note = '') => {
    const response = await api.post(`/bookings/${bookingId}/request-approval`, { note });
    return response.data;
  },

  // Récupérer mes réservations
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // Récupérer une réservation par ID
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Annuler une réservation
  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Mettre à jour le statut d'une réservation (Manager)
  updateBookingStatus: async (id, status) => {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response.data;
  }
};
