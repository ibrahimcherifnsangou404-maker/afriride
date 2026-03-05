const { Agency, Vehicle, User } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Récupérer toutes les agences
// @route   GET /api/agencies
// @access  Public
const getAgencies = async (req, res) => {
  try {
    const agencies = await Agency.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'address', 'phone', 'email', 'logo']
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

// @desc    Récupérer une agence par ID
// @route   GET /api/agencies/:id
// @access  Public
const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          where: { isAvailable: true },
          required: false
        }
      ]
    });

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Erreur récupération agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'agence',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle agence (partenaire - Public)
// @route   POST /api/agencies/register
// @access  Public
const registerAgency = async (req, res) => {
  try {
    const { name, description, address, city, phone, email, logo, licenseNumber, registrationNumber } = req.body;

    // Validation
    if (!name || !phone || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs obligatoires'
      });
    }

    // Vérifier si l'agence existe déjà
    const existingAgency = await Agency.findOne({ where: { email } });
    if (existingAgency) {
      return res.status(409).json({
        success: false,
        message: 'Une agence avec cet email existe déjà'
      });
    }

    const agency = await Agency.create({
      name,
      description: description || '',
      address,
      city: city || '',
      phone,
      email,
      logo: logo || null,
      licenseNumber: licenseNumber || '',
      registrationNumber: registrationNumber || '',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès',
      data: agency
    });
  } catch (error) {
    console.error('Erreur création agence partenaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'agence',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle agence
// @route   POST /api/admin/agencies
// @access  Private/Admin
const partnerSignup = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      address,
      city,
      phone,
      email,
      logo,
      licenseNumber,
      registrationNumber,
      managerFirstName,
      managerLastName,
      managerEmail,
      managerPhone,
      managerPassword
    } = req.body;

    if (
      !name || !phone || !email || !address ||
      !managerFirstName || !managerLastName || !managerEmail || !managerPhone || !managerPassword
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs obligatoires agence et manager'
      });
    }

    if (managerPassword.length < 6) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe manager doit contenir au moins 6 caractères'
      });
    }

    const normalizedAgencyEmail = String(email).trim().toLowerCase();
    const normalizedManagerEmail = String(managerEmail).trim().toLowerCase();

    const existingAgency = await Agency.findOne({ where: { email: normalizedAgencyEmail }, transaction });
    if (existingAgency) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Une agence avec cet email existe déjà'
      });
    }

    const existingManager = await User.findOne({ where: { email: normalizedManagerEmail }, transaction });
    if (existingManager) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Un compte utilisateur avec cet email manager existe déjà'
      });
    }

    const agency = await Agency.create({
      name,
      description: description || '',
      address,
      city: city || '',
      phone,
      email: normalizedAgencyEmail,
      logo: logo || null,
      licenseNumber: licenseNumber || '',
      registrationNumber: registrationNumber || '',
      isActive: true
    }, { transaction });

    const manager = await User.create({
      firstName: managerFirstName,
      lastName: managerLastName,
      email: normalizedManagerEmail,
      phone: managerPhone,
      password: managerPassword,
      role: 'manager',
      agencyId: agency.id,
      isVerified: true,
      verificationStatus: 'verified'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Inscription partenaire réussie',
      data: {
        agency: {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          phone: agency.phone
        },
        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          phone: manager.phone,
          role: manager.role
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur inscription partenaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription partenaire',
      error: error.message
    });
  }
};

const createAgency = async (req, res) => {
  try {
    const { name, description, address, city, phone, email, logo } = req.body;

    // Validation
    if (!name || !phone || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs obligatoires'
      });
    }

    // Vérifier si l'agence existe déjà
    const existingAgency = await Agency.findOne({ where: { email } });
    if (existingAgency) {
      return res.status(409).json({
        success: false,
        message: 'Une agence avec cet email existe déjà'
      });
    }

    const agency = await Agency.create({
      name,
      description,
      address,
      city,
      phone,
      email,
      logo,
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

// @desc    Supprimer une agence
// @route   DELETE /api/admin/agencies/:id
// @access  Private/Admin
const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
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

// @desc    Mettre à jour une agence
// @route   PUT /api/admin/agencies/:id
// @access  Private/Admin
const updateAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    const { name, description, address, city, phone, email, logo, isActive } = req.body;

    await agency.update({
      name: name || agency.name,
      description: description || agency.description,
      address: address || agency.address,
      city: city || agency.city,
      phone: phone || agency.phone,
      email: email || agency.email,
      logo: logo || agency.logo,
      isActive: isActive !== undefined ? isActive : agency.isActive
    });

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

module.exports = {
  getAgencies,
  getAgencyById,
  registerAgency,
  partnerSignup,
  createAgency,
  updateAgency,
  deleteAgency
};
