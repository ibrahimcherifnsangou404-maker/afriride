const express = require('express');
const router = express.Router();
const {
  createBooking,
  checkAvailability,
  requestBookingApproval,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { acceptContract } = require('../controllers/contractController');
const { protect, authorize } = require('../middleware/auth');

// Disponibilite temps reel (public)
router.get('/availability', checkAvailability);

// Routes protégées (Client)
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);

// 🆕 Route pour accepter le contrat (AVANT :id)
router.post('/:bookingId/accept-contract', protect, acceptContract);
router.post('/:id/request-approval', protect, requestBookingApproval);

// Routes avec paramètre ID
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

// Routes protégées (Manager/Admin)
router.put('/:id/status', protect, authorize('manager', 'admin'), updateBookingStatus);

module.exports = router;


