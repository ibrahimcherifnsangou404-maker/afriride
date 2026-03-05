const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contractNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contract_number',
    comment: 'Numéro unique du contrat'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled', 'terminated'),
    defaultValue: 'draft',
    comment: 'Statut du contrat'
  },
  contractType: {
    type: DataTypes.ENUM('rental', 'service', 'insurance'),
    defaultValue: 'rental',
    field: 'contract_type',
    comment: 'Type de contrat'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  terms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Conditions générales du contrat'
  },
  paymentTerms: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'payment_terms',
    comment: 'Conditions de paiement'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  signatureRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'signature_required'
  },
  clientSignatureDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'client_signature_date'
  },
  agencySignatureDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'agency_signature_date'
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'document_url',
    comment: 'URL du document PDF'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes additionnelles'
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'booking_id'
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payment_id',
    comment: 'Paiement associé'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  agencyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'agency_id'
  }
}, {
  tableName: 'contracts',
  timestamps: true,
  underscored: true
});

module.exports = Contract;
