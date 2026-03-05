const express = require('express');
const router = express.Router();
const { 
  getAgencies, 
  getAgencyById,
  registerAgency,
  partnerSignup,
  createAgency,
  updateAgency,
  deleteAgency
} = require('../controllers/agencyController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', getAgencies);
router.get('/:id', getAgencyById);
router.post('/register', registerAgency);
router.post('/partner-signup', partnerSignup);

// Routes admin (protégées)
router.post('/', protect, authorize('admin'), createAgency);
router.put('/:id', protect, authorize('admin'), updateAgency);
router.delete('/:id', protect, authorize('admin'), deleteAgency);

module.exports = router;
