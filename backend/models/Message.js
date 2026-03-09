const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 4000]
    }
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'attachment_url'
  },
  attachmentName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'attachment_name'
  },
  attachmentType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'attachment_type'
  },
  attachmentSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'attachment_size'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at'
  },
  isDeletedForEveryone: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_deleted_for_everyone'
  },
  deletedForUserIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: [],
    field: 'deleted_for_user_ids'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  },
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'deleted_by'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['conversation_id', 'created_at']
    },
    {
      fields: ['conversation_id', 'is_read']
    },
    {
      fields: ['conversation_id', 'is_deleted_for_everyone']
    },
    {
      fields: ['sender_id', 'created_at']
    }
  ]
});

module.exports = Message;
