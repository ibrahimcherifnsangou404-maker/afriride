const { PromoCode, PromoCodeUsage, User, Booking } = require('../models');
const { Op } = require('sequelize');

// Créer un code promo (Admin)
const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, expiresAt, minAmount } = req.body;

    // Validation
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Code, type de réduction et valeur sont requis'
      });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de réduction invalide (percentage ou fixed)'
      });
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Le pourcentage doit être entre 0 et 100'
      });
    }

    // Vérifier si le code existe déjà
    const existingCode = await PromoCode.findOne({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Ce code promo existe déjà'
      });
    }

    // Créer le code promo
    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxUses: maxUses || null,
      expiresAt: expiresAt || null,
      minAmount: minAmount || null
    });

    res.status(201).json({
      success: true,
      message: 'Code promo créé avec succès',
      data: promoCode
    });
  } catch (error) {
    console.error('Erreur création code promo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du code promo'
    });
  }
};

// Récupérer tous les codes promo (Admin)
const getAllPromoCodes = async (req, res) => {
  try {
    // Récupérer les codes promo sans les usages pour éviter les problèmes
    const promoCodes = await PromoCode.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });

    // Pour chaque code, compter les utilisations
    const formattedCodes = await Promise.all(
      promoCodes.map(async (promo) => {
        const usageCount = await PromoCodeUsage.count({
          where: { promoCodeId: promo.id }
        });

        return {
          id: promo.id,
          code: promo.code,
          discountType: promo.discount_type,
          discountValue: parseFloat(promo.discount_value),
          maxUses: promo.max_uses,
          currentUses: promo.current_uses,
          expiresAt: promo.expires_at,
          isActive: promo.is_active,
          minAmount: promo.min_amount ? parseFloat(promo.min_amount) : null,
          createdAt: promo.created_at,
          updatedAt: promo.updated_at,
          usages: [] // On ne charge pas les détails des usages ici
        };
      })
    );

    res.json({
      success: true,
      data: formattedCodes
    });
  } catch (error) {
    console.error('Erreur récupération codes promo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des codes promo',
      error: error.message
    });
  }
};

// Vérifier et valider un code promo
const validatePromoCode = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code promo requis'
      });
    }

    // Rechercher le code promo
    const promoCode = await PromoCode.findOne({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Code promo invalide'
      });
    }

    // Vérifications
    if (!promoCode.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ce code promo n\'est plus actif'
      });
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Ce code promo a expiré'
      });
    }

    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Ce code promo a atteint sa limite d\'utilisations'
      });
    }

    if (promoCode.minAmount && totalAmount < promoCode.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Montant minimum requis : ${promoCode.minAmount} FCFA`
      });
    }

    // Calculer la réduction
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (totalAmount * promoCode.discountValue) / 100;
    } else {
      discountAmount = promoCode.discountValue;
    }

    // S'assurer que la réduction ne dépasse pas le montant total
    discountAmount = Math.min(discountAmount, totalAmount);

    const finalPrice = totalAmount - discountAmount;

    res.json({
      success: true,
      message: 'Code promo valide',
      data: {
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue
        },
        discountAmount,
        finalPrice
      }
    });
  } catch (error) {
    console.error('Erreur validation code promo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code promo'
    });
  }
};

// Mettre à jour un code promo (Admin)
const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const promoCode = await PromoCode.findByPk(id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Code promo non trouvé'
      });
    }

    await promoCode.update(updates);

    res.json({
      success: true,
      message: 'Code promo mis à jour avec succès',
      data: promoCode
    });
  } catch (error) {
    console.error('Erreur mise à jour code promo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du code promo'
    });
  }
};

// Supprimer un code promo (Admin)
const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByPk(id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Code promo non trouvé'
      });
    }

    await promoCode.destroy();

    res.json({
      success: true,
      message: 'Code promo supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression code promo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du code promo'
    });
  }
};

// Récupérer l'historique d'utilisation d'un code promo (Admin)
const getPromoCodeUsages = async (req, res) => {
  try {
    const { id } = req.params;

    const usages = await PromoCodeUsage.findAll({
      where: { promoCodeId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'startDate', 'endDate', 'totalPrice']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: usages
    });
  } catch (error) {
    console.error('Erreur récupération utilisations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisations'
    });
  }
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUsages
};