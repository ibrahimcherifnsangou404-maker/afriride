const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Agency = sequelize.define('Agency', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'license_number'
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'registration_number'
  },
  verificationStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unverified',
    field: 'verification_status'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  },
  kycDocuments: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'kyc_documents'
  },
  kycSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'kyc_submitted_at'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  contractCountry: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contract_country'
  },
  contractJurisdictionCity: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contract_jurisdiction_city'
  },
  defaultDepositAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'default_deposit_amount'
  },
  defaultDailyKmLimit: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'default_daily_km_limit'
  },
  defaultLateFeePerHour: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'default_late_fee_per_hour'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'agencies',
  timestamps: true,
  underscored: true
});

module.exports = Agency;
