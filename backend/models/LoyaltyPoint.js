const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoyaltyPoint = sequelize.define('LoyaltyPoint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Points gagnés ou dépensés'
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'booking_completed, referral, bonus, redeemed'
  }
}, {
  tableName: 'loyalty_points',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = LoyaltyPoint;