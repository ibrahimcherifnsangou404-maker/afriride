const { Vehicle, Booking, User, Agency, Category, Payment, LoyaltyPoint, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// @desc    Dashboard du gestionnaire
// @route   GET /api/manager/dashboard
// @access  Private (Manager)
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Manager Dashboard - User:', req.user?.id, 'Role:', req.user?.role, 'AgencyId:', req.user?.agencyId);

    const agencyId = req.user.agencyId;

    // Vérifier que l'utilisateur a une agence assignée
    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune agence associée à ce compte manager. Veuillez contacter un administrateur.'
      });
    }

    // OPTIMISATION: Requêtes légères en parallèle, requête lourde en séquence

    // 1. Lancer les compteurs en parallèle (rapide)
    const [
      totalVehicles,
      availableVehicles,
      totalBookings,
      pendingBookings
    ] = await Promise.all([
      Vehicle.count({ where: { agencyId } }),
      Vehicle.count({ where: { agencyId, isAvailable: true } }),
      Booking.count({
        include: [{
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          required: true
        }]
      }),
      Booking.count({
        where: { status: 'pending' },
        include: [{
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          required: true
        }]
      })
    ]);

    // 2. Lancer la récupération des données lourdes après (séquentiel)
    const recentBookings = await Booking.findAll({
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          attributes: ['id', 'brand', 'model', 'year', 'licensePlate'],
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          required: true
        }
      ],
      attributes: ['id', 'status', 'startDate', 'endDate', 'totalPrice', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: false,
      subQuery: false
    });

    console.log('✅ Dashboard data loaded successfully');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalVehicles,
          availableVehicles,
          totalBookings,
          pendingBookings
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les véhicules de l'agence
// @route   GET /api/manager/vehicles
// @access  Private (Manager)
const getAgencyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { agencyId: req.user.agencyId },
      include: [
        { model: Category, as: 'category' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Erreur récupération véhicules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des véhicules',
      error: error.message
    });
  }
};

// @desc    Récupérer toutes les réservations de l'agence
// @route   GET /api/manager/bookings
// @access  Private (Manager)
const getAgencyBookings = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { status = 'all', q = '', page = '1', limit = '12' } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const offset = (pageNumber - 1) * pageSize;
    const normalizedSearch = String(q || '').trim();

    const bookingWhere = {};
    if (status && status !== 'all') {
      bookingWhere.status = status;
    }

    if (normalizedSearch) {
      bookingWhere[Op.or] = [
        { '$vehicle.brand$': { [Op.iLike]: `%${normalizedSearch}%` } },
        { '$vehicle.model$': { [Op.iLike]: `%${normalizedSearch}%` } },
        { '$user.first_name$': { [Op.iLike]: `%${normalizedSearch}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${normalizedSearch}%` } },
        { '$user.email$': { [Op.iLike]: `%${normalizedSearch}%` } }
      ];
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: bookingWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          ...(isAdmin ? {} : { where: { agencyId: req.user.agencyId } }),
          include: [{ model: Category, as: 'category' }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
      subQuery: false
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      total: count,
      data: bookings,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems: count,
        totalPages: Math.max(Math.ceil(count / pageSize), 1),
        hasNextPage: offset + bookings.length < count,
        hasPrevPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Erreur r�cup�ration r�servations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la r�cup�ration des r�servations',
      error: error.message
    });
  }
};

// @desc    Confirmer une réservation
// @route   PUT /api/manager/bookings/:id/confirm
// @access  Private (Manager)
const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;
    const isAdmin = req.user.role === 'admin';

    const booking = await Booking.findByPk(id, {
      include: [{
        model: Vehicle,
        as: 'vehicle',
        ...(isAdmin ? {} : { where: { agencyId } })
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Réservation confirmée',
      data: booking
    });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation',
      error: error.message
    });
  }
};

// @desc    Refuser une réservation
// @route   PUT /api/manager/bookings/:id/reject
// @access  Private (Manager)
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const agencyId = req.user.agencyId;
    const isAdmin = req.user.role === 'admin';

    const booking = await Booking.findByPk(id, {
      include: [{
        model: Vehicle,
        as: 'vehicle',
        ...(isAdmin ? {} : { where: { agencyId } })
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    booking.status = 'cancelled';
    booking.notes = reason || '';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Réservation refusée',
      data: booking
    });
  } catch (error) {
    console.error('Erreur refus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus',
      error: error.message
    });
  }
};


// @desc    Terminer une r�servation
// @route   PUT /api/manager/bookings/:id/complete
// @access  Private (Manager)
const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;
    const isAdmin = req.user.role === 'admin';

    const booking = await Booking.findByPk(id, {
      include: [{
        model: Vehicle,
        as: 'vehicle',
        ...(isAdmin ? {} : { where: { agencyId } }),
        required: true
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'R�servation non trouv�e'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de terminer une r�servation annul�e'
      });
    }

    booking.status = 'completed';
    await booking.save();

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

    res.status(200).json({
      success: true,
      message: 'R�servation termin�e avec succ�s',
      data: booking
    });
  } catch (error) {
    console.error('Erreur compl�tion r�servation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la compl�tion de la r�servation',
      error: error.message
    });
  }
};
// @desc    Envoyer un message au client
// @route   POST /api/manager/bookings/:id/message
// @access  Private (Manager)
const sendMessageToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const agencyId = req.user.agencyId;

    const booking = await Booking.findByPk(id, {
      include: [{
        model: Vehicle,
        as: 'vehicle',
        where: { agencyId }
      },
      {
        model: User,
        as: 'user'
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // TODO: Intégrer un système de notification/messagerie
    // Pour maintenant, on simule juste la sauvegarde
    console.log(`Message envoyé à ${booking.user.email}: ${message}`);

    res.status(200).json({
      success: true,
      message: 'Message envoyé au client',
      data: {
        bookingId: id,
        clientEmail: booking.user.email,
        messageSent: message
      }
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
};

// @desc    Récupérer le détail d'une réservation
// @route   GET /api/manager/bookings/:id
// @access  Private (Manager)
const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          include: [{ model: Category, as: 'category' }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur détail réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques de revenus
// @route   GET /api/manager/revenue
// @access  Private (Manager)
const getRevenueStats = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    console.log('?? [RevenueStats] START for agencyId:', agencyId);

    if (!agencyId) {
      console.warn('?? [RevenueStats] No agencyId found for user');
    }

    const { startDate, endDate, status, paymentStatus } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);

    const baseWhere = {};
    if (Object.keys(dateFilter).length > 0) {
      baseWhere.createdAt = dateFilter;
    }
    if (status) {
      baseWhere.status = status;
    }
    if (paymentStatus) {
      baseWhere.paymentStatus = paymentStatus;
    }

    // 1. Revenu Total (sur paiements r�ussis)
    console.log('?? [RevenueStats] STEP 1: Fetching all relevant bookings for sum...');
    const revenueBookings = await Booking.findAll({
      where: {
        ...baseWhere,
        paymentStatus: paymentStatus || 'paid'
      },
      include: [{
        model: Vehicle,
        as: 'vehicle',
        where: { agencyId },
        attributes: ['id'],
        required: true
      }],
      attributes: ['totalPrice']
    });

    const totalRevenue = revenueBookings.reduce((acc, curr) => {
      return acc + parseFloat(curr.totalPrice || 0);
    }, 0);
    console.log('?? [RevenueStats] STEP 1 Result:', totalRevenue);

    // 2. Revenu par mois
    console.log('?? [RevenueStats] STEP 2: Monthly Query...');
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), 1);

    const monthlyBookings = await Booking.findAll({
      attributes: ['totalPrice', 'createdAt'],
      where: {
        status: { [Op.in]: ['completed', 'confirmed'] },
        paymentStatus: paymentStatus || 'paid',
        createdAt: { [Op.gte]: lastYear }
      },
      include: [{
        model: Vehicle,
        as: 'vehicle',
        where: { agencyId },
        attributes: [],
        required: true
      }],
      order: [['createdAt', 'ASC']]
    });

    const monthlyRevenue = {};
    monthlyBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + parseFloat(booking.totalPrice);
    });

    const chartData = Object.keys(monthlyRevenue).map(key => ({
      name: key,
      value: monthlyRevenue[key]
    }));
    console.log('?? [RevenueStats] STEP 2 Result Items:', chartData.length);

    const normalizeTransactions = (rows) => rows.map((tx) => {
      const payments = tx.payments || [];
      const lastPayment = payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      return {
        id: tx.id,
        totalPrice: tx.totalPrice,
        status: tx.status,
        paymentStatus: tx.paymentStatus,
        createdAt: tx.createdAt,
        vehicle: tx.vehicle,
        user: tx.user,
        paymentId: lastPayment?.id || null,
        paymentState: lastPayment?.status || null
      };
    });

    // 3. Transactions r�centes
    console.log('?? [RevenueStats] STEP 3: Recent Transactions...');
    const recentTransactions = await Booking.findAll({
      where: baseWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          attributes: ['brand', 'model'],
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
          required: true
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'status', 'createdAt'],
          required: false
        }
      ],
      attributes: ['id', 'totalPrice', 'status', 'createdAt', 'paymentStatus'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    console.log('?? [RevenueStats] STEP 3 Result Items:', recentTransactions.length);

    // 4. Transactions compl�tes (table)
    const allTransactions = await Booking.findAll({
      where: baseWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: { agencyId },
          attributes: ['brand', 'model'],
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
          required: true
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'status', 'createdAt'],
          required: false
        }
      ],
      attributes: ['id', 'totalPrice', 'status', 'createdAt', 'paymentStatus'],
      order: [['createdAt', 'DESC']]
    });

    const normalizedAll = normalizeTransactions(allTransactions);
    const normalizedRecent = normalizeTransactions(recentTransactions);

    const avgBasket = normalizedAll.length
      ? normalizedAll.reduce((acc, curr) => acc + parseFloat(curr.totalPrice || 0), 0) / normalizedAll.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        monthlyGrowth: 15,
        expectedRevenue: totalRevenue * 1.2,
        avgBasket,
        chartData,
        recentTransactions: normalizedRecent,
        transactions: normalizedAll
      }
    });
    console.log('?? [RevenueStats] SUCCESS');
  } catch (error) {
    console.error('? [RevenueStats] FATAL ERROR:', error);
    try {
      const errorLog = `\n--- ERROR ${new Date().toISOString()} ---\nMessage: ${error.message}\nStack: ${error.stack}\nUser ID: ${req.user?.id || 'N/A'}\n---------------------------------------\n`;
      fs.appendFileSync(path.join(__dirname, '../revenue_error.log'), errorLog);
    } catch (logError) {
      console.error('Failed to write to log file:', logError);
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des revenus',
      error: error.message
    });
  }
};
const getPendingKYC = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        verificationStatus: 'pending'
      },
      attributes: { exclude: ['password'] },
      order: [['updatedAt', 'ASC']]
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erreur récupération KYC pending:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes KYC'
    });
  }
};

// @desc    Valider un dossier KYC
// @route   PUT /api/manager/kyc/:id/approve
// @access  Private (Manager)
const approveKYC = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.update({
      verificationStatus: 'verified',
      isVerified: true,
      rejectionReason: null
    });

    // TODO: Envoyer email de confirmation

    res.json({
      success: true,
      message: 'Utilisateur vérifié avec succès',
      data: {
        id: user.id,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Erreur approbation KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du dossier'
    });
  }
};

// @desc    Rejeter un dossier KYC
// @route   PUT /api/manager/kyc/:id/reject
// @access  Private (Manager)
const rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Le motif de rejet est requis' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.update({
      verificationStatus: 'rejected',
      isVerified: false,
      rejectionReason: reason
    });

    // TODO: Envoyer email de rejet avec la raison

    res.json({
      success: true,
      message: 'Dossier rejeté',
      data: {
        id: user.id,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason
      }
    });

  } catch (error) {
    console.error('Erreur rejet KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du dossier'
    });
  }
};

module.exports = {
  getDashboard,
  getAgencyVehicles,
  getAgencyBookings,
  confirmBooking,
  rejectBooking,
  completeBooking,
  sendMessageToClient,
  getBookingDetail,
  getRevenueStats,
  getPendingKYC,
  approveKYC,
  rejectKYC
};







