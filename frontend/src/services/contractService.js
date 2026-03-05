import api from './api';

class ContractService {
  // Créer un contrat
  async createContract(contractData) {
    return api.post('/contracts', contractData);
  }

  // Récupérer les contrats d'une réservation
  async getContractsByBooking(bookingId) {
    return api.get(`/contracts/booking/${bookingId}`);
  }

  // Récupérer un contrat par ID
  async getContractById(contractId) {
    return api.get(`/contracts/${contractId}`);
  }

  // Mettre à jour un contrat
  async updateContract(contractId, contractData) {
    return api.put(`/contracts/${contractId}`, contractData);
  }

  // Signer le contrat en tant que client
  async signContractAsClient(contractId) {
    return api.post(`/contracts/${contractId}/sign-client`);
  }

  // Signer le contrat en tant qu'agence
  async signContractAsAgency(contractId) {
    return api.post(`/contracts/${contractId}/sign-agency`);
  }

  // Supprimer un contrat
  async deleteContract(contractId) {
    return api.delete(`/contracts/${contractId}`);
  }

  // Générer un contrat dynamique avec les informations du client et de la réservation
  async generateContractContent(bookingData) {
    return api.post('/contracts/generate', bookingData);
  }

  // Accepter le contrat
  async acceptContract(bookingId) {
    return api.post(`/bookings/${bookingId}/accept-contract`);
  }
}

export const contractService = new ContractService();

