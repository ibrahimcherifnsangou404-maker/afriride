const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserBlock = sequelize.define('UserBlock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  blockerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'blocker_id'
  },
  blockedId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'blocked_id'
  }
}, {
  tableName: 'user_blocks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['blocker_id', 'blocked_id']
    },
    {
      fields: ['blocker_id']
    },
    {
      fields: ['blocked_id']
    }
  ]
});

module.exports = UserBlock;
