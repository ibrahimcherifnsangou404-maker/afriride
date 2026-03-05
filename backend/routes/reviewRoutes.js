const express = require('express');
const router = express.Router();
const {
  createReview,
  getVehicleReviews,
  getAllReviews,
  approveReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Routes Admin (DOIVENT ÊTRE EN PREMIER !)
router.get('/', protect, authorize('admin'), getAllReviews);
router.put('/:id/approve', protect, authorize('admin'), approveReview); // ← VÉRIFIE CETTE LIGNE
router.delete('/:id', protect, authorize('admin'), deleteReview);

// Routes publiques et utilisateurs
router.post('/', protect, createReview);
router.get('/vehicle/:vehicleId', getVehicleReviews);

module.exports = router;