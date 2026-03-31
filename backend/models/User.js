const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'manager', 'admin'),
    defaultValue: 'client'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
    defaultValue: 'unverified',
    field: 'verification_status'
  },
  idCardFront: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'id_card_front'
  },
  idCardBack: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'id_card_back'
  },
  drivingLicense: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'driving_license'
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'rejection_reason'
  },
  agencyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'agency_id'
  },
  // Champs pour réinitialisation de mot de passe
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reset_password_token'
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_password_expire'
  },
  // Champ pour confirmation d'email
  emailConfirmationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_confirmation_token'
  },
  // Champ pour la photo de profil
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'profile_picture'
  },
  cookieConsentData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'cookie_consent_data'
  },
  cookieConsentUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cookie_consent_updated_at'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (user) => {
      if (typeof user.email === 'string') {
        user.email = user.email.trim().toLowerCase();
      }
    },
    // Crypter le mot de passe avant de sauvegarder
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Méthode pour comparer les mots de passe
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
