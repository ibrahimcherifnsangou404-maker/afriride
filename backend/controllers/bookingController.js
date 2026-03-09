const { Booking, Vehicle, User, Agency, LoyaltyPoint, BookingApproval, Contract, Payment, sequelize } = require('../models');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const {
  HOLD_MINUTES,
  getHoldExpiresAt,
  isVehicleDateRangeAvailable
} = require('../services/bookingAvailabilityService');

const generateQuoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QTE-${year}${month}${day}-${random}`;
};

const roundAmount = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getCancellationPolicy = ({ booking, paidAmount = 0, now = new Date() }) => {
  const startAt = new Date(`${booking.startDate}T00:00:00`);
  const msBeforeStart = startAt.getTime() - now.getTime();
  const hoursBeforeStart = Number.isFinite(msBeforeStart) ? msBeforeStart / (1000 * 60 * 60) : 0;

  if (booking.paymentStatus !== 'paid' || paidAmount <= 0) {
    return {
      tier: 'no_payment',
      refundRate: 0,
      reason: 'Aucun paiement confirme sur cette reservation'
    };
  }

  if (hoursBeforeStart >= 72) {
    return {
      tier: 'flex_72h',
      refundRate: 1,
      reason: 'Annulation au moins 72h avant le depart'
    };
  }

  if (hoursBeforeStart >= 24) {
    return {
      tier: 'mid_24h',
      refundRate: 0.5,
      reason: 'Annulation entre 24h et 72h avant le depart'
    };
  }

  return {
    tier: 'late_under_24h',
    refundRate: 0,
    reason: 'Annulation a moins de 24h du depart'
  };
};

const getCancellationQuote = async (booking, now = new Date(), transaction = null) => {
  const payments = await Payment.findAll({
    where: { bookingId: booking.id },
    order: [['createdAt', 'ASC']],
    transaction
  });

  const totalPaid = payments
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalAlreadyRefunded = payments
    .filter((item) => item.status === 'refunded')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const refundableBase = Math.max(0, roundAmount(totalPaid - totalAlreadyRefunded));
  const policy = getCancellationPolicy({ booking, paidAmount: refundableBase, now });
  const refundAmount = roundAmount(refundableBase * policy.refundRate);

  return {
    now: now.toISOString(),
    bookingStartDate: booking.startDate,
    totalPaid: roundAmount(totalPaid),
    totalAlreadyRefunded: roundAmount(totalAlreadyRefunded),
    refundableBase,
    refundAmount,
    refundRate: policy.refundRate,
    policyTier: policy.tier,
    policyReason: policy.reason
  };
};

// @desc    Créer une réservation
// @route   POST /api/bookings
// @access  Private (Client)
const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, notes } = req.body;
    const userId = req.user.id;

    // Vérifier que tous les champs sont remplis
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    // Vérifier que le véhicule existe
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier que le véhicule est disponible
    if (!vehicle.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Ce véhicule n\'est pas disponible'
      });
    }

    // Calculer le nombre de jours
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être après la date de début'
      });
    }

    // Vérifier si le véhicule est déjà réservé pour ces dates
    const availability = await isVehicleDateRangeAvailable({ vehicleId, startDate, endDate });
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: 'Ce vehicule est deja reserve ou verrouille pour ces dates'
      });
    }

    // Calculer le prix total
    const pricePerDay = parseFloat(vehicle.pricePerDay);
    const totalPrice = totalDays * pricePerDay;

    // Créer la réservation
    const booking = await Booking.create({
      userId,
      vehicleId,
      startDate,
      endDate,
      totalDays,
      pricePerDay,
      totalPrice,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Récupérer la réservation avec les relations
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: Agency, as: 'agency', attributes: ['name', 'phone', 'address'] }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    await Contract.create({
      contractNumber: generateQuoteNumber(),
      status: 'draft',
      contractType: 'service',
      startDate: booking.startDate,
      endDate: booking.endDate,
      terms: `Devis pre-paiement pour location ${bookingWithDetails.vehicle.brand} ${bookingWithDetails.vehicle.model}. Validation finale apres paiement.`,
      paymentTerms: 'Paiement requis avant confirmation definitive de la reservation.',
      totalAmount: booking.totalPrice,
      signatureRequired: false,
      notes: 'Devis genere automatiquement avant paiement.',
      bookingId: booking.id,
      paymentId: null,
      userId: booking.userId,
      agencyId: bookingWithDetails.vehicle.agencyId
    });

    // 🆕 Envoyer email de confirmation de réservation
    emailService.sendBookingConfirmationEmail(
      bookingWithDetails,
      bookingWithDetails.vehicle,
      bookingWithDetails.user
    ).catch(err => console.error('Erreur envoi email:', err.message));

    // 🆕 Envoyer SMS de confirmation (optionnel)
    smsService.sendBookingConfirmationSMS(
      bookingWithDetails.user.phone,
      `${bookingWithDetails.vehicle.brand} ${bookingWithDetails.vehicle.model}`,
      booking.id
    ).catch(err => console.error('Erreur envoi SMS:', err.message));

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: {
        ...bookingWithDetails.toJSON(),
        holdMinutes: HOLD_MINUTES,
        holdExpiresAt: getHoldExpiresAt(bookingWithDetails.createdAt)
      }
    });
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation',
      error: error.message
    });
  }
};

// @desc    Récupérer toutes les réservations de l'utilisateur connecté
// @route   GET /api/bookings/my-bookings
// @access  Private (Client)

// @desc    Verifier la disponibilite d'un vehicule
// @route   GET /api/bookings/availability
// @access  Public
const checkAvailability = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId, startDate et endDate sont requis'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Plage de dates invalide'
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle || !vehicle.isAvailable) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          reason: 'vehicle_unavailable'
        }
      });
    }

    const availability = await isVehicleDateRangeAvailable({ vehicleId, startDate, endDate });

    res.status(200).json({
      success: true,
      data: {
        available: availability.available,
        reason: availability.available ? null : 'overlap_or_hold',
        holdMinutes: HOLD_MINUTES
      }
    });
  } catch (error) {
    console.error('Erreur verification disponibilite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la verification de disponibilite',
      error: error.message
    });
  }
};

// @desc    Demander une approbation manager pour une reservation
// @route   POST /api/bookings/:id/request-approval
// @access  Private (Client)
const requestBookingApproval = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'agencyId'] }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation introuvable'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acces refuse'
      });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette reservation ne peut plus etre soumise a approbation'
      });
    }

    const existingPending = await BookingApproval.findOne({
      where: {
        bookingId: booking.id,
        status: 'pending'
      }
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Une demande d approbation est deja en attente'
      });
    }

    const approval = await BookingApproval.create({
      bookingId: booking.id,
      requesterId: req.user.id,
      status: 'pending',
      requestNote: req.body?.note || null
    });

    res.status(201).json({
      success: true,
      message: 'Demande d approbation envoyee',
      data: approval
    });
  } catch (error) {
    console.error('Erreur demande approbation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande d approbation',
      error: error.message
    });
  }
};
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: Agency, as: 'agency', attributes: ['name', 'phone'] }
          ]
        },
        {
          model: BookingApproval,
          as: 'approvals',
          include: [
            { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'], required: false }
          ],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Erreur récupération réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// @desc    Récupérer une réservation par ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: Agency, as: 'agency' }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        },
        {
          model: BookingApproval,
          as: 'approvals',
          include: [
            { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'], required: false }
          ],
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur a le droit de voir cette réservation
    if (
      req.user.role === 'client' && 
      booking.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir cette réservation'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur récupération réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation',
      error: error.message
    });
  }
};

// @desc    Apercu de la politique d'annulation et remboursement
// @route   GET /api/bookings/:id/cancellation-preview
// @access  Private
const getCancellationPreview = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation non trouvee'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acces refuse'
      });
    }

    const quote = await getCancellationQuote(booking);
    return res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Erreur apercu annulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l apercu d annulation',
      error: error.message
    });
  }
};

// @desc    Annuler une réservation
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Client)
const cancelBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est bien l'utilisateur qui a créé la réservation
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler cette réservation'
      });
    }

    // Vérifier que la réservation peut être annulée
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être annulée'
      });
    }

    // Annuler la réservation
    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: booking
    });
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la réservation',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le statut d'une réservation (Gestionnaire/Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private (Manager/Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier les statuts valides
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    booking.status = status;
    await booking.save();

    // Attribution automatique des points de fidélité à la complétion (sans doublon)
    if (status === 'completed') {
      const existingReward = await LoyaltyPoint.findOne({
        where: {
          userId: booking.userId,
          bookingId: booking.id,
          reason: 'booking_completed'
        }
      });

      if (!existingReward) {
        const basePoints = 100;
        const bonusPoints = parseFloat(booking.totalPrice || 0) >= 100000 ? 50 : 0;
        await LoyaltyPoint.create({
          userId: booking.userId,
          bookingId: booking.id,
          points: basePoints + bonusPoints,
          reason: 'booking_completed'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: booking
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

const cancelBookingV2 = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const cancellationReason = String(req.body?.reason || '').trim();
    if (cancellationReason.length < 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La raison d annulation est requise (minimum 5 caracteres)'
      });
    }

    const booking = await Booking.findByPk(req.params.id, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservation non trouvee'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Vous n etes pas autorise a annuler cette reservation'
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'in_progress') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cette reservation ne peut pas etre annulee'
      });
    }

    const quote = await getCancellationQuote(booking, new Date(), transaction);
    const latestCompletedPayment = await Payment.findOne({
      where: {
        bookingId: booking.id,
        status: 'completed'
      },
      order: [['createdAt', 'DESC']],
      transaction
    });

    if (quote.refundAmount > 0) {
      await Payment.create({
        amount: quote.refundAmount,
        paymentMethod: latestCompletedPayment?.paymentMethod || booking.paymentMethod || 'card',
        phoneNumber: latestCompletedPayment?.phoneNumber || null,
        bookingId: booking.id,
        userId: booking.userId,
        status: 'refunded',
        transactionId: `RFN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }, { transaction });
      booking.paymentStatus = 'refunded';
    }

    booking.status = 'cancelled';
    booking.notes = [
      booking.notes,
      `Raison annulation: ${cancellationReason}`,
      `Annulation ${new Date().toISOString()} | politique=${quote.policyTier} | taux=${Math.round(quote.refundRate * 100)}% | remboursement=${quote.refundAmount}`
    ].filter(Boolean).join('\n');
    await booking.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: quote.refundAmount > 0
        ? 'Reservation annulee. Remboursement enregistre.'
        : 'Reservation annulee. Aucun remboursement applicable.',
      data: {
        booking,
        cancellation: quote
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur annulation reservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l annulation de la reservation',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  checkAvailability,
  requestBookingApproval,
  getMyBookings,
  getBookingById,
  getCancellationPreview,
  cancelBooking: cancelBookingV2,
  updateBookingStatus
};




