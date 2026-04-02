const crypto = require('crypto');
const { User, Agency, Category, Vehicle, Booking, MessageReport, Message, Conversation } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const emailService = require('../services/emailService');

const EMAIL_CODE_EXPIRY_MINUTES = 10;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const generateEmailVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildEmailVerificationToken = (code) => {
  const expiresAt = new Date(Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const hashedCode = crypto
    .createHash('sha256')
    .update(String(code || '').trim())
    .digest('hex');

  return `${hashedCode}:${expiresAt}`;
};

const sanitizeAgencyDocuments = (agency) => {
  const docs = agency?.kycDocuments || {};
  return {
    businessLicense: docs.businessLicense || null,
    taxCertificate: docs.taxCertificate || null,
    insuranceCertificate: docs.insuranceCertificate || null
  };
};

const extractCancellationReason = (notes) => {
  const raw = String(notes || '');
  const match = raw.match(/Raison annulation:\s*(.+)/i);
  if (!match || !match[1]) return 'Non renseignee';
  return match[1].trim();
};

const extractRefundAmountFromNotes = (notes) => {
  const raw = String(notes || '');
  const match = raw.match(/remboursement=([0-9]+(?:\.[0-9]+)?)/i);
  if (!match || !match[1]) return 0;
  return Number(match[1]) || 0;
};

const toCsvCell = (value) => {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
};

const buildCancellationRecords = async ({
  startDate,
  endDate,
  agencyId,
  refunded,
  q,
  limit = 500
} = {}) => {
  const where = { status: 'cancelled' };
  if (startDate || endDate) {
    where.updatedAt = {};
    if (startDate) where.updatedAt[Op.gte] = new Date(startDate);
    if (endDate) where.updatedAt[Op.lte] = new Date(endDate);
  }

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['id', 'brand', 'model', 'agencyId'],
        include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }],
        required: false
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 500, 1), 2000)
  });

  let records = bookings.map((booking) => {
    const reason = extractCancellationReason(booking.notes);
    const refundAmount = extractRefundAmountFromNotes(booking.notes);
    const isRefunded = booking.paymentStatus === 'refunded' || refundAmount > 0;
    return {
      id: booking.id,
      updatedAt: booking.updatedAt,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: Number(booking.totalPrice || 0),
      paymentStatus: booking.paymentStatus,
      refundAmount: Number(refundAmount || 0),
      isRefunded,
      reason,
      user: booking.user ? {
        id: booking.user.id,
        firstName: booking.user.firstName,
        lastName: booking.user.lastName,
        email: booking.user.email
      } : null,
      vehicle: booking.vehicle ? {
        id: booking.vehicle.id,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model
      } : null,
      agency: booking.vehicle?.agency ? {
        id: booking.vehicle.agency.id,
        name: booking.vehicle.agency.name
      } : null
    };
  });

  if (agencyId) {
    records = records.filter((item) => item.agency?.id === agencyId);
  }

  if (refunded === 'yes') {
    records = records.filter((item) => item.isRefunded);
  } else if (refunded === 'no') {
    records = records.filter((item) => !item.isRefunded);
  }

  if (q && String(q).trim()) {
    const keyword = String(q).trim().toLowerCase();
    records = records.filter((item) => {
      const haystack = [
        item.reason,
        item.user?.firstName,
        item.user?.lastName,
        item.user?.email,
        item.vehicle?.brand,
        item.vehicle?.model,
        item.agency?.name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }

  const summary = {
    total: records.length,
    refundedCount: records.filter((item) => item.isRefunded).length,
    nonRefundedCount: records.filter((item) => !item.isRefunded).length,
    totalEstimatedRefund: records.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0)
  };

  return { records, summary };
};

// @desc    Dashboard admin avec statistiques globales
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    // Statistiques globales
    const totalAgencies = await Agency.count();
    const totalVehicles = await Vehicle.count();
    const totalBookings = await Booking.count();
    const totalUsers = await User.count({ where: { role: 'client' } });

    // Revenus totaux (en considérant toutes les réservations)
    const allBookings = await Booking.findAll({
      attributes: ['totalPrice']
    });
    
    const totalRevenue = allBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalPrice || 0);
    }, 0);

    // Réservations par statut
    const bookingsByStatus = await Booking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Top 5 agences par nombre de réservations
    const agenciesWithBookings = await Agency.findAll({
      attributes: [
        'id',
        'name',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM bookings
            INNER JOIN vehicles ON bookings.vehicle_id = vehicles.id
            WHERE vehicles.agency_id = "Agency"."id"
          )`),
          'bookingCount'
        ]
      ],
      order: [[sequelize.literal('"bookingCount"'), 'DESC']],
      limit: 5,
      raw: true
    });

    // Réservations récentes
    const recentBookings = await Booking.findAll({
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { 
              model: Agency, 
              as: 'agency',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const cancelledBookings = await Booking.findAll({
      where: { status: 'cancelled' },
      attributes: ['id', 'notes', 'paymentStatus', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    });

    const reasonsCount = new Map();
    let refundedCount = 0;
    let totalEstimatedRefund = 0;

    cancelledBookings.forEach((booking) => {
      const reason = extractCancellationReason(booking.notes);
      reasonsCount.set(reason, (reasonsCount.get(reason) || 0) + 1);
      if (booking.paymentStatus === 'refunded') refundedCount += 1;
      totalEstimatedRefund += extractRefundAmountFromNotes(booking.notes);
    });

    const topCancellationReasons = Array.from(reasonsCount.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log('=== STATS ADMIN ===');
    console.log('Agences:', totalAgencies);
    console.log('Véhicules:', totalVehicles);
    console.log('Réservations:', totalBookings);
    console.log('Clients:', totalUsers);
    console.log('Revenus:', totalRevenue);
    console.log('==================');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalAgencies,
          totalVehicles,
          totalBookings,
          totalUsers,
          totalRevenue: totalRevenue || 0
        },
        bookingsByStatus,
        topAgencies: agenciesWithBookings,
        recentBookings,
        cancellationInsights: {
          cancelledCount: cancelledBookings.length,
          refundedCount,
          nonRefundedCount: Math.max(0, cancelledBookings.length - refundedCount),
          topReasons: topCancellationReasons,
          totalEstimatedRefund
        }
      }
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard',
      error: error.message
    });
  }
};

// @desc    Récupérer toutes les agences
// @route   GET /api/admin/agencies
// @access  Private (Admin)
const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.findAll({
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id']
        },
        {
          model: User,
          as: 'managers',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: agencies.length,
      data: agencies
    });
  } catch (error) {
    console.error('Erreur récupération agences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des agences',
      error: error.message
    });
  }
};

// @desc    Créer une agence
// @route   POST /api/admin/agencies
// @access  Private (Admin)
const createAgency = async (req, res) => {
  try {
    const { name, description, address, phone, email } = req.body;

    if (!name || !address || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    // Vérifier si l'email existe déjà
    const existingAgency = await Agency.findOne({ where: { email } });
    if (existingAgency) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const agency = await Agency.create({
      name,
      description,
      address,
      phone,
      email,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès',
      data: agency
    });
  } catch (error) {
    console.error('Erreur création agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'agence',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une agence
// @route   PUT /api/admin/agencies/:id
// @access  Private (Admin)
const updateAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    await agency.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Agence mise à jour avec succès',
      data: agency
    });
  } catch (error) {
    console.error('Erreur mise à jour agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'agence',
      error: error.message
    });
  }
};

// @desc    Supprimer une agence
// @route   DELETE /api/admin/agencies/:id
// @access  Private (Admin)
const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    // Vérifier s'il y a des véhicules
    const vehicleCount = await Vehicle.count({ where: { agencyId: req.params.id } });
    
    if (vehicleCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette agence car elle a des véhicules'
      });
    }

    await agency.destroy();

    res.status(200).json({
      success: true,
      message: 'Agence supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'agence',
      error: error.message
    });
  }
};

// @desc    Récupérer toutes les catégories
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
};

// @desc    Créer une catégorie
// @route   POST /api/admin/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est obligatoire'
      });
    }

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cette catégorie existe déjà'
      });
    }

    const category = await Category.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une catégorie
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    await category.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: category
    });
  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie',
      error: error.message
    });
  }
};

// @desc    Supprimer une catégorie
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    const vehicleCount = await Vehicle.count({ where: { categoryId: req.params.id } });
    
    if (vehicleCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette catégorie car elle a des véhicules'
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les utilisateurs
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// @desc    Créer un gestionnaire pour une agence
// @route   POST /api/admin/users/create-manager
// @access  Private (Admin)
const createManager = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, agencyId } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!firstName || !lastName || !normalizedEmail || !phone || !agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir une adresse email valide'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier que l'agence existe
    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    // Créer le gestionnaire
    const temporaryPassword = crypto.randomBytes(24).toString('hex');
    const confirmationCode = generateEmailVerificationCode();

    const manager = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password: temporaryPassword,
      role: 'manager',
      agencyId,
      isVerified: false,
      verificationStatus: 'unverified',
      emailConfirmationToken: buildEmailVerificationToken(confirmationCode)
    });

    try {
      const emailResult = await emailService.sendVerificationCodeEmail(manager, confirmationCode, EMAIL_CODE_EXPIRY_MINUTES);
      if (!emailResult?.success) {
        return res.status(502).json({
          success: false,
          message: 'Gestionnaire cree, mais impossible d envoyer l email de verification pour le moment'
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi code gestionnaire admin:', emailError);
      return res.status(502).json({
        success: false,
        message: 'Gestionnaire cree, mais impossible d envoyer l email de verification pour le moment'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Gestionnaire créé avec succès',
      data: {
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email,
        phone: manager.phone,
        role: manager.role,
        agencyId: manager.agencyId,
        isVerified: manager.isVerified
      }
    });
  } catch (error) {
    console.error('Erreur création gestionnaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du gestionnaire',
      error: error.message
    });
  }
};

// @desc    Approuver le KYC d'une agence
// @route   PUT /api/admin/agencies/:id/approve-kyc
// @access  Private (Admin)
const approveAgencyKyc = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvee'
      });
    }

    await agency.update({
      verificationStatus: 'verified',
      rejectionReason: null,
      verifiedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Agence verifiee avec succes',
      data: {
        id: agency.id,
        verificationStatus: agency.verificationStatus,
        verifiedAt: agency.verifiedAt
      }
    });
  } catch (error) {
    console.error('Erreur approbation KYC agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation KYC agence',
      error: error.message
    });
  }
};

// @desc    Rejeter le KYC d'une agence
// @route   PUT /api/admin/agencies/:id/reject-kyc
// @access  Private (Admin)
const rejectAgencyKyc = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Le motif de rejet est requis'
      });
    }

    const agency = await Agency.findByPk(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvee'
      });
    }

    await agency.update({
      verificationStatus: 'rejected',
      rejectionReason: reason,
      verifiedAt: null
    });

    await Vehicle.update(
      { isAvailable: false },
      { where: { agencyId: agency.id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Agence rejetee et vehicules depublies',
      data: {
        id: agency.id,
        verificationStatus: agency.verificationStatus,
        rejectionReason: agency.rejectionReason
      }
    });
  } catch (error) {
    console.error('Erreur rejet KYC agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet KYC agence',
      error: error.message
    });
  }
};

// @desc    Recuperer les dossiers KYC agence
// @route   GET /api/admin/agencies/kyc
// @access  Private (Admin)
const getAgencyKycRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const where = {};
    if (['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
      where.verificationStatus = status;
    }

    const agencies = await Agency.findAll({
      where,
      include: [
        {
          model: User,
          as: 'managers',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          required: false
        },
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'isAvailable'],
          required: false
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: agencies.length,
      data: agencies.map((agency) => ({
        ...agency.toJSON(),
        kycDocuments: sanitizeAgencyDocuments(agency)
      }))
    });
  } catch (error) {
    console.error('Erreur recuperation KYC agences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des dossiers KYC agence',
      error: error.message
    });
  }
};

// @desc    Récupérer les dossiers KYC en attente
// @route   GET /api/admin/kyc/pending
// @access  Private (Admin)
const getPendingKYC = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { verificationStatus: 'pending' },
      attributes: { exclude: ['password'] },
      order: [['updatedAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erreur récupération KYC pending (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes KYC',
      error: error.message
    });
  }
};

// @desc    Approuver un dossier KYC
// @route   PUT /api/admin/kyc/:id/approve
// @access  Private (Admin)
const approveKYC = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({
      verificationStatus: 'verified',
      isVerified: true,
      rejectionReason: null
    });

    emailService.sendKycApprovedEmail(user).catch((err) =>
      console.error('Erreur email validation KYC (admin):', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Utilisateur vérifié avec succès',
      data: {
        id: user.id,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Erreur approbation KYC (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du dossier',
      error: error.message
    });
  }
};

// @desc    Rejeter un dossier KYC
// @route   PUT /api/admin/kyc/:id/reject
// @access  Private (Admin)
const rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le motif de rejet est requis'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({
      verificationStatus: 'rejected',
      isVerified: false,
      rejectionReason: String(reason).trim()
    });

    res.status(200).json({
      success: true,
      message: 'Dossier rejeté',
      data: {
        id: user.id,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Erreur rejet KYC (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du dossier',
      error: error.message
    });
  }
};

// @desc    Récupérer les signalements de messagerie
// @route   GET /api/admin/message-reports
// @access  Private (Admin)
const getMessageReports = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const where = {};
    if (['pending', 'resolved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const reports = await MessageReport.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Conversation, as: 'conversation', attributes: ['id', 'participantOneId', 'participantTwoId'] },
        {
          model: Message,
          as: 'message',
          attributes: ['id', 'content', 'attachmentName', 'attachmentType', 'createdAt'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Erreur récupération signalements messagerie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des signalements',
      error: error.message
    });
  }
};

// @desc    Traiter un signalement de messagerie
// @route   PUT /api/admin/message-reports/:id
// @access  Private (Admin)
const reviewMessageReport = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body || {};
    if (!['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide (utiliser resolved ou rejected)'
      });
    }

    const report = await MessageReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement introuvable'
      });
    }

    await report.update({
      status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      resolutionNote: resolutionNote ? String(resolutionNote).trim() : null
    });

    res.status(200).json({
      success: true,
      message: 'Signalement mis à jour',
      data: report
    });
  } catch (error) {
    console.error('Erreur traitement signalement messagerie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du signalement',
      error: error.message
    });
  }
};

// @desc    Lister les annulations de reservations
// @route   GET /api/admin/cancellations
// @access  Private (Admin)
const getCancellations = async (req, res) => {
  try {
    const { startDate, endDate, agencyId, refunded, q, limit } = req.query;
    const { records, summary } = await buildCancellationRecords({
      startDate,
      endDate,
      agencyId,
      refunded,
      q,
      limit
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      summary,
      data: records
    });
  } catch (error) {
    console.error('Erreur recuperation annulations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des annulations',
      error: error.message
    });
  }
};

// @desc    Export CSV des annulations
// @route   GET /api/admin/cancellations/export
// @access  Private (Admin)
const exportCancellationsCsv = async (req, res) => {
  try {
    const { startDate, endDate, agencyId, refunded, q, limit } = req.query;
    const { records } = await buildCancellationRecords({
      startDate,
      endDate,
      agencyId,
      refunded,
      q,
      limit
    });

    const headers = [
      'ID',
      'Date annulation',
      'Date debut',
      'Date fin',
      'Client',
      'Email client',
      'Agence',
      'Vehicule',
      'Montant reservation',
      'Rembourse',
      'Montant remboursement',
      'Raison'
    ];

    const lines = [
      headers.map(toCsvCell).join(';'),
      ...records.map((item) => ([
        item.id,
        item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
        item.startDate || '',
        item.endDate || '',
        `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim(),
        item.user?.email || '',
        item.agency?.name || '',
        `${item.vehicle?.brand || ''} ${item.vehicle?.model || ''}`.trim(),
        item.totalPrice,
        item.isRefunded ? 'oui' : 'non',
        item.refundAmount,
        item.reason
      ]).map(toCsvCell).join(';'))
    ];

    const csv = lines.join('\n');
    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=annulations_${dateTag}.csv`);
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    console.error('Erreur export annulations CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l export CSV',
      error: error.message
    });
  }
};

// N'oublie pas d'exporter la fonction
module.exports = {
  getDashboard,
  getAllAgencies,
  getAgencyKycRequests,
  approveAgencyKyc,
  rejectAgencyKyc,
  createAgency,
  updateAgency,
  deleteAgency,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  createManager,
  getPendingKYC,
  approveKYC,
  rejectKYC,
  getMessageReports,
  reviewMessageReport,
  getCancellations,
  exportCancellationsCsv
};
