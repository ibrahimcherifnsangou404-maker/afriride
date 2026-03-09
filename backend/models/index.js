const { sequelize } = require('../config/database');
const User = require('./User');
const Agency = require('./Agency');
const Category = require('./Category');
const Vehicle = require('./Vehicle');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Review = require('./Review');
const LoyaltyPoint = require('./LoyaltyPoint');
const PromoCode = require('./PromoCode');
const PromoCodeUsage = require('./PromoCodeUsage');
const Contract = require('./Contract');
const Favorite = require('./Favorite');
const Conversation = require('./Conversation');
const Message = require('./Message');
const BookingApproval = require('./BookingApproval');
const MessageReport = require('./MessageReport');
const UserBlock = require('./UserBlock');

// Définir les relations entre les modèles

// User - Agency
Agency.hasMany(User, { foreignKey: 'agency_id', as: 'managers' });
User.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });

// Agency - Vehicle
Agency.hasMany(Vehicle, { foreignKey: 'agency_id', as: 'vehicles' });
Vehicle.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });

// Category - Vehicle
Category.hasMany(Vehicle, { foreignKey: 'category_id', as: 'vehicles' });
Vehicle.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User - Booking
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Vehicle - Booking
Vehicle.hasMany(Booking, { foreignKey: 'vehicle_id', as: 'bookings' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// Booking - Payment
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User - Payment
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Review
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Vehicle - Review
Vehicle.hasMany(Review, { foreignKey: 'vehicle_id', as: 'reviews' });
Review.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// Booking - Review
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// LoyaltyPoint associations
User.hasMany(LoyaltyPoint, { foreignKey: 'user_id', as: 'loyaltyPoints' });
LoyaltyPoint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasMany(LoyaltyPoint, { foreignKey: 'booking_id', as: 'loyaltyPoints' });
LoyaltyPoint.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// PromoCode associations
Booking.belongsTo(PromoCode, { foreignKey: 'promo_code_id', as: 'promoCode' });
PromoCode.hasMany(Booking, { foreignKey: 'promo_code_id', as: 'bookings' });

// PromoCodeUsage associations
PromoCode.hasMany(PromoCodeUsage, { foreignKey: 'promo_code_id', as: 'usages' });
PromoCodeUsage.belongsTo(PromoCode, { foreignKey: 'promo_code_id', as: 'promoCode' });

User.hasMany(PromoCodeUsage, { foreignKey: 'user_id', as: 'promoCodeUsages' });
PromoCodeUsage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasMany(PromoCodeUsage, { foreignKey: 'booking_id', as: 'promoCodeUsages' });
PromoCodeUsage.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Contract associations
Booking.hasMany(Contract, { foreignKey: 'booking_id', as: 'contracts' });
Contract.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Payment.hasMany(Contract, { foreignKey: 'payment_id', as: 'contracts' });
Contract.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

User.hasMany(Contract, { foreignKey: 'user_id', as: 'contracts' });
Contract.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Agency.hasMany(Contract, { foreignKey: 'agency_id', as: 'contracts' });
Contract.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });

// Favorite associations
User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Vehicle.hasMany(Favorite, { foreignKey: 'vehicle_id', as: 'favoritedBy' });
Favorite.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// Conversation associations
User.hasMany(Conversation, { foreignKey: 'participant_one_id', as: 'conversationsAsFirst' });
User.hasMany(Conversation, { foreignKey: 'participant_two_id', as: 'conversationsAsSecond' });
Conversation.belongsTo(User, { foreignKey: 'participant_one_id', as: 'participantOne' });
Conversation.belongsTo(User, { foreignKey: 'participant_two_id', as: 'participantTwo' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// MessageReport associations
User.hasMany(MessageReport, { foreignKey: 'reporter_id', as: 'reportedMessages' });
MessageReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

User.hasMany(MessageReport, { foreignKey: 'reported_user_id', as: 'messageReportsAgainstUser' });
MessageReport.belongsTo(User, { foreignKey: 'reported_user_id', as: 'reportedUser' });

User.hasMany(MessageReport, { foreignKey: 'reviewed_by', as: 'reviewedMessageReports' });
MessageReport.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

Conversation.hasMany(MessageReport, { foreignKey: 'conversation_id', as: 'reports' });
MessageReport.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

Message.hasMany(MessageReport, { foreignKey: 'message_id', as: 'reports' });
MessageReport.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

// UserBlock associations
User.hasMany(UserBlock, { foreignKey: 'blocker_id', as: 'blocksInitiated' });
UserBlock.belongsTo(User, { foreignKey: 'blocker_id', as: 'blocker' });

User.hasMany(UserBlock, { foreignKey: 'blocked_id', as: 'blocksReceived' });
UserBlock.belongsTo(User, { foreignKey: 'blocked_id', as: 'blocked' });

// BookingApproval associations
Booking.hasMany(BookingApproval, { foreignKey: 'booking_id', as: 'approvals' });
BookingApproval.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

User.hasMany(BookingApproval, { foreignKey: 'requester_id', as: 'bookingApprovalRequests' });
BookingApproval.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

User.hasMany(BookingApproval, { foreignKey: 'approver_id', as: 'bookingApprovalDecisions' });
BookingApproval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

// Fonction pour synchroniser les modèles avec la base de données
const syncDatabase = async () => {
  try {
    console.log('🔄 Synchronisation de la base de données...');

    // Niveau 1 - tables de base (sans foreign keys vers d'autres tables custom)
    await Agency.sync({ alter: false });
    await Category.sync({ alter: false });
    await PromoCode.sync({ alter: false });

    // Niveau 2 - tables qui dépendent du niveau 1
    await User.sync({ alter: false });
    await Vehicle.sync({ alter: false });

    // Niveau 3 - tables qui dépendent du niveau 2
    await Booking.sync({ alter: false });
    await Favorite.sync({ alter: false });
    await Conversation.sync({ alter: false });

    // Niveau 4 - tables qui dépendent du niveau 3
    await Payment.sync({ alter: false });
    await Review.sync({ alter: false });
    await LoyaltyPoint.sync({ alter: false });
    await PromoCodeUsage.sync({ alter: false });
    await Message.sync({ alter: false });
    await BookingApproval.sync({ alter: false });

    // Niveau 5 - tables qui dépendent du niveau 4
    await Contract.sync({ alter: false });
    await MessageReport.sync({ alter: false });
    await UserBlock.sync({ alter: false });

    console.log('✅ Base de données synchronisée !');
  } catch (error) {
    console.error('❌ Erreur de synchronisation:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Agency,
  Category,
  Vehicle,
  Booking,
  Payment,
  Review,
  LoyaltyPoint,
  PromoCode,
  PromoCodeUsage,
  Contract,
  Favorite,
  Conversation,
  Message,
  BookingApproval,
  MessageReport,
  UserBlock,
  syncDatabase
};