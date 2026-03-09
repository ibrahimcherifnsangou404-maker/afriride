const express = require('express');
const router = express.Router();
const {
  createBooking,
  checkAvailability,
  requestBookingApproval,
  getMyBookings,
  getBookingById,
  getCancellationPreview,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { acceptContract } = require('../controllers/contractController');
const { protect, authorize } = require('../middleware/auth');

// Disponibilite temps reel (public)
router.get('/availability', checkAvailability);

// Routes protÃ©gÃ©es (Client)
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);

// ðŸ†• Route pour accepter le contrat (AVANT :id)
router.post('/:bookingId/accept-contract', protect, acceptContract);
router.post('/:id/request-approval', protect, requestBookingApproval);

// Routes avec paramÃ¨tre ID
router.get('/:id', protect, getBookingById);
router.get('/:id/cancellation-preview', protect, getCancellationPreview);
router.put('/:id/cancel', protect, cancelBooking);

// Routes protÃ©gÃ©es (Manager/Admin)
router.put('/:id/status', protect, authorize('manager', 'admin'), updateBookingStatus);

module.exports = router;



