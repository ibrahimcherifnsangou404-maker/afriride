const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  createManager,
  getPendingKYC,
  approveKYC,
  rejectKYC,
  getMessageReports,
  reviewMessageReport
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent le rôle "admin"
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Agences
router.get('/agencies', getAllAgencies);
router.post('/agencies', createAgency);
router.put('/agencies/:id', updateAgency);
router.delete('/agencies/:id', deleteAgency);

// Catégories
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Utilisateurs
router.get('/users', getAllUsers);
router.post('/users/create-manager', createManager);

// KYC
router.get('/kyc/pending', getPendingKYC);
router.put('/kyc/:id/approve', approveKYC);
router.put('/kyc/:id/reject', rejectKYC);

// Modération messagerie
router.get('/message-reports', getMessageReports);
router.put('/message-reports/:id', reviewMessageReport);

module.exports = router;
