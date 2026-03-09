const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes protégées
router.use(protect);

router.post('/kyc', upload.fields([
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 }
]), userController.submitKYC);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/cookie-consent', userController.getCookieConsent);
router.put('/cookie-consent', userController.updateCookieConsent);

module.exports = router;
