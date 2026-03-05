const express = require('express');
const router = express.Router();
const {
  createPromoCode,
  getAllPromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUsages
} = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/auth');

// Routes utilisateur (authentifié)
router.post('/validate', protect, validatePromoCode);

// Routes admin
router.post('/', protect, authorize('admin'), createPromoCode);
router.get('/', protect, authorize('admin'), getAllPromoCodes);
router.put('/:id', protect, authorize('admin'), updatePromoCode);
router.delete('/:id', protect, authorize('admin'), deletePromoCode);
router.get('/:id/usages', protect, authorize('admin'), getPromoCodeUsages);

module.exports = router;