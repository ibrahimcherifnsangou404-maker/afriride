const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MessageReport = sequelize.define('MessageReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'reporter_id'
  },
  reportedUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'reported_user_id'
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id'
  },
  messageId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'message_id'
  },
  reason: {
    type: DataTypes.ENUM('spam', 'abuse', 'harassment', 'fraud', 'other'),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at'
  },
  resolutionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resolution_note'
  }
}, {
  tableName: 'message_reports',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['status', 'created_at'] },
    { fields: ['conversation_id', 'created_at'] },
    { fields: ['reporter_id', 'created_at'] },
    { fields: ['reported_user_id', 'created_at'] }
  ]
});

module.exports = MessageReport;
