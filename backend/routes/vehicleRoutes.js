const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes publiques
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Routes protégées (Gestionnaire et Admin)
router.post('/', protect, authorize('manager', 'admin'), upload.array('images', 5), createVehicle);
router.put('/:id', protect, authorize('manager', 'admin'), upload.array('images', 5), updateVehicle);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteVehicle);

module.exports = router;