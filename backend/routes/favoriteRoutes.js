const express = require('express');
const router = express.Router();
const { toggleFavorite, getMyFavorites, checkFavoriteStatus } = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.post('/:vehicleId', protect, toggleFavorite);
router.get('/', protect, getMyFavorites);
router.get('/check/:vehicleId', protect, checkFavoriteStatus);

module.exports = router;
