const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  totalDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_days'
  },
  pricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_day'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'momo_mtn', 'momo_orange', 'cash'),
    allowNull: true,
    field: 'payment_method'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'vehicle_id'
  },
  // 🆕 NOUVEAUX CHAMPS POUR LES CODES PROMO
  promoCodeId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'promo_code_id',
    references: {
      model: 'promo_codes',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'discount_amount',
    comment: 'Montant de la réduction appliquée'
  },
  finalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'final_price',
    comment: 'Prix final après réduction (totalPrice - discountAmount)'
  },
  // 🆕 CHAMP POUR L'ACCEPTATION DU CONTRAT
  contractAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contract_accepted',
    comment: 'Le client a accepté les conditions du contrat'
  },
  contractAcceptedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'contract_accepted_date',
    comment: 'Date et heure de l\'acceptation du contrat'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true
});

module.exports = Booking;