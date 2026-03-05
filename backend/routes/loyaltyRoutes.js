const express = require('express');
const router = express.Router();
const {
  getUserPoints,
  getLoyaltyRules,
  addPoints,
  redeemPoints,
  getAllUsersPoints
} = require('../controllers/loyaltyController');
const { protect, authorize } = require('../middleware/auth');

// Routes utilisateur (authentifié)
router.get('/my-points', protect, getUserPoints);
router.get('/rules', protect, getLoyaltyRules);
router.post('/redeem', protect, redeemPoints);

// Routes admin
router.post('/add', protect, authorize('admin'), addPoints);
router.get('/users', protect, authorize('admin'), getAllUsersPoints);

module.exports = router;
