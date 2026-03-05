const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromoCodeUsage = sequelize.define('PromoCodeUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  promoCodeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'promo_code_id',
    references: {
      model: 'promo_codes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant de la réduction appliquée'
  }
}, {
  tableName: 'promo_code_usages',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = PromoCodeUsage;