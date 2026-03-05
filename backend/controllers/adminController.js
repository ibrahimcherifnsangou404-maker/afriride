const { User, Agency, Category, Vehicle, Booking } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

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
        recentBookings
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
    const { firstName, lastName, email, phone, password, agencyId } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
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
    const manager = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'manager',
      agencyId,
      isVerified: true
    });

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
        agencyId: manager.agencyId
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

// N'oublie pas d'exporter la fonction
module.exports = {
  getDashboard,
  getAllAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  createManager // Ajoute ceci
};