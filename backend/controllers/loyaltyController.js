const { LoyaltyPoint, User, Booking, sequelize } = require('../models');

const LOYALTY_RULES = {
  earn: {
    completedBookingBase: 100,
    highValueBookingBonusThreshold: 100000,
    highValueBookingBonusPoints: 50
  },
  redeem: {
    minPoints: 100,
    step: 100,
    fcfaPerPoint: 10
  }
};

const getTierByPoints = (points) => {
  if (points >= 5000) return { name: 'Platinum', next: null };
  if (points >= 2000) return { name: 'Gold', next: 5000 };
  if (points >= 500) return { name: 'Silver', next: 2000 };
  return { name: 'Bronze', next: 500 };
};

// Recuperer le solde de points d'un utilisateur
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await LoyaltyPoint.findAll({
      where: { userId },
      attributes: [[sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']],
      raw: true
    });

    const totalPoints = parseInt(result[0]?.totalPoints, 10) || 0;

    const history = await LoyaltyPoint.findAll({
      where: { userId },
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'startDate', 'endDate'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    const tier = getTierByPoints(totalPoints);
    const pointsToNextTier = tier.next ? Math.max(tier.next - totalPoints, 0) : 0;

    res.json({
      success: true,
      data: {
        totalPoints,
        tier,
        pointsToNextTier,
        rules: LOYALTY_RULES,
        history
      }
    });
  } catch (error) {
    console.error('Erreur recuperation points:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des points',
      error: error.message
    });
  }
};

// Ajouter des points a un utilisateur (Admin)
const addPoints = async (req, res) => {
  try {
    const { userId, points, reason, bookingId } = req.body;

    if (!userId || !points || !reason) {
      return res.status(400).json({
        success: false,
        message: 'userId, points et reason sont requis'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    const loyaltyPoint = await LoyaltyPoint.create({
      userId,
      points,
      reason,
      bookingId: bookingId || null
    });

    res.status(201).json({
      success: true,
      message: `${points} points ajoutes avec succes`,
      data: loyaltyPoint
    });
  } catch (error) {
    console.error('Erreur ajout points:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l ajout des points'
    });
  }
};

// Utiliser des points pour obtenir une reduction
const redeemPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pointsToRedeem } = req.body;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de points invalide'
      });
    }

    if (pointsToRedeem < LOYALTY_RULES.redeem.minPoints || pointsToRedeem % LOYALTY_RULES.redeem.step !== 0) {
      return res.status(400).json({
        success: false,
        message: `Le minimum est ${LOYALTY_RULES.redeem.minPoints} points, par pas de ${LOYALTY_RULES.redeem.step}.`
      });
    }

    const result = await LoyaltyPoint.findAll({
      where: { userId },
      attributes: [[sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']],
      raw: true
    });

    const totalPoints = parseInt(result[0]?.totalPoints, 10) || 0;

    if (totalPoints < pointsToRedeem) {
      return res.status(400).json({
        success: false,
        message: `Solde insuffisant. Vous avez ${totalPoints} points.`
      });
    }

    await LoyaltyPoint.create({
      userId,
      points: -pointsToRedeem,
      reason: 'redeemed',
      bookingId: null
    });

    const discount = pointsToRedeem * LOYALTY_RULES.redeem.fcfaPerPoint;

    res.json({
      success: true,
      message: `${pointsToRedeem} points utilises`,
      data: {
        pointsRedeemed: pointsToRedeem,
        discountAmount: discount,
        remainingPoints: totalPoints - pointsToRedeem
      }
    });
  } catch (error) {
    console.error('Erreur utilisation points:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l utilisation des points'
    });
  }
};

// Recuperer tous les utilisateurs avec leurs points (Admin)
const getAllUsersPoints = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email'],
      include: [
        {
          model: LoyaltyPoint,
          as: 'loyaltyPoints',
          attributes: ['points']
        }
      ]
    });

    const usersWithPoints = users
      .map((user) => {
        const userObj = user.toJSON();
        const totalPoints = userObj.loyaltyPoints.reduce((sum, lp) => sum + lp.points, 0);
        return {
          id: userObj.id,
          firstName: userObj.firstName,
          lastName: userObj.lastName,
          email: userObj.email,
          totalPoints
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      success: true,
      data: usersWithPoints
    });
  } catch (error) {
    console.error('Erreur recuperation utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des utilisateurs'
    });
  }
};

const getLoyaltyRules = async (req, res) => {
  res.json({
    success: true,
    data: LOYALTY_RULES
  });
};

module.exports = {
  getUserPoints,
  getLoyaltyRules,
  addPoints,
  redeemPoints,
  getAllUsersPoints
};

