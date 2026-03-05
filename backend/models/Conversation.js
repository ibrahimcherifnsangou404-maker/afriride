const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participantOneId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'participant_one_id'
  },
  participantTwoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'participant_two_id'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_message_at'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['participant_one_id', 'participant_two_id']
    }
  ]
});

module.exports = Conversation;
