const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingApproval = sequelize.define('BookingApproval', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'booking_id'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'requester_id'
  },
  approverId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approver_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  requestNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_note'
  },
  decisionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'decision_note'
  },
  decidedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'decided_at'
  }
}, {
  tableName: 'booking_approvals',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['booking_id', 'status'] },
    { fields: ['requester_id'] },
    { fields: ['approver_id'] }
  ]
});

module.exports = BookingApproval;
