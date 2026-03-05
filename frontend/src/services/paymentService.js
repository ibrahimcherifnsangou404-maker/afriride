import api from './api';

export const paymentService = {
  // Initier un paiement
  initiatePayment: async (data) => {
    return await api.post('/payments/initiate', data);
  },

  // Traiter un paiement
  processPayment: async (data) => {
    return await api.post('/payments/process', data);
  },

  // Obtenir le statut d'un paiement
  getPaymentStatus: async (id) => {
    return await api.get(`/payments/${id}`);
  },

  // Lister les factures/reçus
  getInvoices: async (filters = {}) => {
    return await api.get('/payments/invoices', { params: filters });
  },
  // Lister les factures consolidees B2B
  getConsolidatedInvoices: async (filters = {}) => {
    return await api.get('/payments/invoices/consolidated', { params: filters });
  },

  // Telecharger une facture consolidee B2B (PDF)
  downloadConsolidatedReceipt: async (userId, filters = {}) => {
    return await api.get(`/payments/invoices/consolidated/${userId}/receipt`, {
      params: filters,
      responseType: 'blob'
    });
  },
  // Télécharger le reçu de paiement (PDF)
  downloadReceipt: async (id) => {
    return await api.get(`/payments/${id}/receipt`, { responseType: 'blob' });
  }
};

