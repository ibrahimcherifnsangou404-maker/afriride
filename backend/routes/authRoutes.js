const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  confirmEmail,
  verifyEmailCode,
  resendEmailCode,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ─── Rate Limiters ─────────────────────────────────────────────────────────────
// Login / mot de passe oublié : 5 tentatives / 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
  skipSuccessfulRequests: true // Ne compter que les échecs
});

// Renvoi de code email : 3 demandes / 30 minutes
const emailCodeLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de demandes de code. Réessayez dans 30 minutes.' }
});

// Inscription : 10 / heure par IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop d\'inscriptions depuis cette adresse. Réessayez dans 1 heure.' }
});

// ─── Routes publiques ──────────────────────────────────────────────────────────
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/confirm-email-code', verifyEmailCode);
router.post('/resend-email-code', emailCodeLimiter, resendEmailCode);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/confirm-email/:token', confirmEmail);

// ─── Routes protégées (nécessitent un token) ──────────────────────────────────
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;
