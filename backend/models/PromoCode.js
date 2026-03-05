const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromoCode = sequelize.define('PromoCode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true // ✅ unique en minuscule, pas UNIQUE
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
    field: 'discount_type'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'discount_value'
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_uses'
  },
  currentUses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_uses'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'min_amount'
  }
}, {
  tableName: 'promo_codes',
  timestamps: true,
  underscored: true
});

module.exports = PromoCode;