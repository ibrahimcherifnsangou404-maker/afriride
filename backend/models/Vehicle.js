const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'license_plate'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic'),
    defaultValue: 'manual'
  },
  fuelType: {
    type: DataTypes.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
    defaultValue: 'petrol',
    field: 'fuel_type'
  },
  pricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_day'
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  features: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available'
  },
  agencyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'agency_id'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id'
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  underscored: true
});

module.exports = Vehicle;