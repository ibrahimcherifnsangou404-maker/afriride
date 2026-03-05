const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  confirmEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/confirm-email/:token', confirmEmail);

// Routes protégées (nécessitent un token)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;