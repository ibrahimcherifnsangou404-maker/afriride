const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, paymentController.initiatePayment);
router.post('/process', protect, paymentController.processPayment);
router.get('/invoices', protect, paymentController.getInvoices);
router.get('/invoices/consolidated', protect, paymentController.getConsolidatedInvoices);
router.get('/invoices/consolidated/:userId/receipt', protect, paymentController.downloadConsolidatedInvoice);
router.get('/:id', protect, paymentController.getPaymentStatus);
router.get('/:id/receipt', protect, paymentController.downloadReceipt);

module.exports = router;
