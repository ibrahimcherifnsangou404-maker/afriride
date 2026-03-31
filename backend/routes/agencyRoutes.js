const express = require('express');
const router = express.Router();
const { 
  getAgencies, 
  getAgencyById,
  registerAgency,
  partnerSignup,
  getMyAgencyKyc,
  submitAgencyKyc,
  getMyAgencyContractPolicy,
  updateMyAgencyContractPolicy,
  createAgency,
  updateAgency,
  deleteAgency
} = require('../controllers/agencyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes publiques
router.get('/', getAgencies);
router.post('/register', registerAgency);
router.post('/partner-signup', partnerSignup);
router.get('/my-kyc', protect, authorize('manager', 'admin'), getMyAgencyKyc);
router.get('/my-contract-policy', protect, authorize('manager', 'admin'), getMyAgencyContractPolicy);
router.put('/my-contract-policy', protect, authorize('manager', 'admin'), updateMyAgencyContractPolicy);
router.put(
  '/my-kyc',
  protect,
  authorize('manager', 'admin'),
  upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'taxCertificate', maxCount: 1 },
    { name: 'insuranceCertificate', maxCount: 1 }
  ]),
  submitAgencyKyc
);
router.get('/:id', getAgencyById);

// Routes admin (protégées)
router.post('/', protect, authorize('admin'), createAgency);
router.put('/:id', protect, authorize('admin'), updateAgency);
router.delete('/:id', protect, authorize('admin'), deleteAgency);

module.exports = router;
