const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAgencyVehicles,
  getAgencyBookings,
  confirmBooking,
  rejectBooking,
  completeBooking,
  sendMessageToClient,
  getBookingDetail,
  getRevenueStats,
  getPendingKYC,
  approveKYC,
  rejectKYC
} = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/auth');
const { getApprovals, approve, reject } = require('../controllers/approvalController');

// Toutes les routes nécessitent le rôle "manager"
router.use(protect);
router.use(authorize('manager', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/vehicles', getAgencyVehicles);
router.get('/bookings', getAgencyBookings);

// Routes pour les réservations
router.get('/bookings/:id', getBookingDetail);
router.put('/bookings/:id/confirm', confirmBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.put('/bookings/:id/complete', completeBooking);
router.post('/bookings/:id/message', sendMessageToClient);

// Stats Financières
router.get('/revenue', getRevenueStats);

// Workflow approbations entreprise
router.get('/approvals', getApprovals);
router.put('/approvals/:id/approve', approve);
router.put('/approvals/:id/reject', reject);

// Routes KYC
router.get('/kyc/pending', getPendingKYC);
router.put('/kyc/:id/approve', approveKYC);
router.put('/kyc/:id/reject', rejectKYC);

module.exports = router;

