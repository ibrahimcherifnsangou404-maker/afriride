const express = require('express');
const router = express.Router();
const {
  createContract,
  getContractsByBooking,
  getContractById,
  updateContract,
  signContractAsClient,
  signContractAsAgency,
  deleteContract,
  generateContractContent,
  acceptContract
} = require('../controllers/contractController');
const { protect, authorize } = require('../middleware/auth');

// 🆕 Routes pour la génération et acceptation de contrat (AVANT les routes avec params)
// Pas de restriction de rôle pour générer un contrat, juste protection
router.post('/generate', protect, generateContractContent);

// Routes protégées - Créer/Modifier (Manager et Admin)
router.post('/', protect, authorize('manager', 'admin'), createContract);

// Routes protégées - Récupérer les contrats
router.get('/booking/:bookingId', protect, getContractsByBooking);

// Routes de signature
router.post('/:id/sign-client', protect, signContractAsClient);
router.post('/:id/sign-agency', protect, authorize('manager', 'admin'), signContractAsAgency);

// Routes pour les IDs (à la fin pour éviter les conflits)
router.get('/:id', protect, getContractById);
router.put('/:id', protect, authorize('manager', 'admin'), updateContract);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteContract);

module.exports = router;

