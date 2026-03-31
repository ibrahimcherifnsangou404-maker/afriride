const crypto = require('crypto');
const { Agency, Vehicle, User } = require('../models');
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

const sanitizeDocuments = (agency) => {
  const docs = agency?.kycDocuments || {};
  return {
    businessLicense: docs.businessLicense || null,
    taxCertificate: docs.taxCertificate || null,
    insuranceCertificate: docs.insuranceCertificate || null
  };
};

const sanitizeContractPolicy = (agency) => ({
  contractCountry: agency?.contractCountry || '',
  contractJurisdictionCity: agency?.contractJurisdictionCity || '',
  defaultDepositAmount: agency?.defaultDepositAmount || '',
  defaultDailyKmLimit: agency?.defaultDailyKmLimit || '',
  defaultLateFeePerHour: agency?.defaultLateFeePerHour || ''
});

// @desc    Récupérer toutes les agences
// @route   GET /api/agencies
// @access  Public
const getAgencies = async (req, res) => {
  try {
    const agencies = await Agency.findAll({
      where: { isActive: true, verificationStatus: 'verified' },
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
    const agency = await Agency.findOne({
      where: { id: req.params.id, verificationStatus: 'verified', isActive: true },
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

    if (!isValidEmail(normalizedAgencyEmail) || !isValidEmail(normalizedManagerEmail)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir des adresses email valides pour l agence et le manager'
      });
    }

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

    const confirmationCode = generateEmailVerificationCode();

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
      isVerified: false,
      verificationStatus: 'unverified',
      emailConfirmationToken: buildEmailVerificationToken(confirmationCode)
    }, { transaction });

    await transaction.commit();

    try {
      await emailService.sendVerificationCodeEmail(manager, confirmationCode, EMAIL_CODE_EXPIRY_MINUTES);
    } catch (emailError) {
      console.error('Erreur envoi code manager:', emailError);
    }

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
          role: manager.role,
          isVerified: manager.isVerified
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

// @desc    Recuperer le statut KYC de l'agence du manager connecte
// @route   GET /api/agencies/my-kyc
// @access  Private (Manager/Admin)
const getMyAgencyKyc = async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune agence associee a ce compte'
      });
    }

    const agency = await Agency.findByPk(req.user.agencyId, {
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'licenseNumber',
        'registrationNumber',
        'verificationStatus',
        'rejectionReason',
        'kycDocuments',
        'kycSubmittedAt',
        'verifiedAt',
        'contractCountry',
        'contractJurisdictionCity',
        'defaultDepositAmount',
        'defaultDailyKmLimit',
        'defaultLateFeePerHour'
      ]
    });

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...agency.toJSON(),
        kycDocuments: sanitizeDocuments(agency),
        contractPolicy: sanitizeContractPolicy(agency)
      }
    });
  } catch (error) {
    console.error('Erreur recuperation KYC agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation du KYC agence',
      error: error.message
    });
  }
};

// @desc    Soumettre ou mettre a jour le dossier KYC de l'agence
// @route   PUT /api/agencies/my-kyc
// @access  Private (Manager/Admin)
const submitAgencyKyc = async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune agence associee a ce compte'
      });
    }

    const agency = await Agency.findByPk(req.user.agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable'
      });
    }

    const { city, address, phone, email, licenseNumber, registrationNumber } = req.body || {};
    const normalizedEmail = String(email || agency.email || '').trim().toLowerCase();

    if (!address || !phone || !normalizedEmail || !licenseNumber || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez completer les informations legales et les coordonnees de l agence'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir une adresse email valide pour l agence'
      });
    }

    const files = req.files || {};
    const currentDocs = sanitizeDocuments(agency);
    const nextDocs = {
      businessLicense: files.businessLicense?.[0] ? `/uploads/documents/${files.businessLicense[0].filename}` : currentDocs.businessLicense,
      taxCertificate: files.taxCertificate?.[0] ? `/uploads/documents/${files.taxCertificate[0].filename}` : currentDocs.taxCertificate,
      insuranceCertificate: files.insuranceCertificate?.[0] ? `/uploads/documents/${files.insuranceCertificate[0].filename}` : currentDocs.insuranceCertificate
    };

    if (!nextDocs.businessLicense || !nextDocs.taxCertificate || !nextDocs.insuranceCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir la licence commerciale, le certificat fiscal et l assurance'
      });
    }

    await agency.update({
      city: city || agency.city,
      address,
      phone,
      email: normalizedEmail,
      licenseNumber,
      registrationNumber,
      kycDocuments: nextDocs,
      kycSubmittedAt: new Date(),
      verificationStatus: 'pending',
      rejectionReason: null
    });

    return res.status(200).json({
      success: true,
      message: 'Dossier KYC agence soumis avec succes',
      data: {
        ...agency.toJSON(),
        kycDocuments: sanitizeDocuments(agency)
      }
    });
  } catch (error) {
    console.error('Erreur soumission KYC agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission du KYC agence',
      error: error.message
    });
  }
};

// @desc    Recuperer la politique contractuelle de l'agence connectee
// @route   GET /api/agencies/my-contract-policy
// @access  Private (Manager/Admin)
const getMyAgencyContractPolicy = async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune agence associee a ce compte'
      });
    }

    const agency = await Agency.findByPk(req.user.agencyId, {
      attributes: [
        'id',
        'name',
        'verificationStatus',
        'contractCountry',
        'contractJurisdictionCity',
        'defaultDepositAmount',
        'defaultDailyKmLimit',
        'defaultLateFeePerHour'
      ]
    });

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: agency.id,
        name: agency.name,
        verificationStatus: agency.verificationStatus,
        ...sanitizeContractPolicy(agency)
      }
    });
  } catch (error) {
    console.error('Erreur recuperation politique contrat agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation de la politique contractuelle',
      error: error.message
    });
  }
};

// @desc    Mettre a jour la politique contractuelle de l'agence connectee
// @route   PUT /api/agencies/my-contract-policy
// @access  Private (Manager/Admin)
const updateMyAgencyContractPolicy = async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune agence associee a ce compte'
      });
    }

    const agency = await Agency.findByPk(req.user.agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable'
      });
    }

    const {
      contractCountry,
      contractJurisdictionCity,
      defaultDepositAmount,
      defaultDailyKmLimit,
      defaultLateFeePerHour
    } = req.body || {};

    if (!contractCountry || !contractJurisdictionCity || !defaultDepositAmount || !defaultDailyKmLimit || !defaultLateFeePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner le pays, la ville de juridiction, la caution, le kilometrage journalier et la penalite de retard'
      });
    }

    const normalizedKm = String(defaultDailyKmLimit).trim();
    if (!/^\d+$/.test(normalizedKm) || Number(normalizedKm) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le kilometrage journalier doit etre un nombre entier positif'
      });
    }

    await agency.update({
      contractCountry: String(contractCountry).trim(),
      contractJurisdictionCity: String(contractJurisdictionCity).trim(),
      defaultDepositAmount: String(defaultDepositAmount).trim(),
      defaultDailyKmLimit: normalizedKm,
      defaultLateFeePerHour: String(defaultLateFeePerHour).trim()
    });

    return res.status(200).json({
      success: true,
      message: 'Politique contractuelle mise a jour avec succes',
      data: {
        id: agency.id,
        name: agency.name,
        verificationStatus: agency.verificationStatus,
        ...sanitizeContractPolicy(agency)
      }
    });
  } catch (error) {
    console.error('Erreur mise a jour politique contrat agence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise a jour de la politique contractuelle',
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
  deleteAgency,
  getMyAgencyKyc,
  submitAgencyKyc,
  getMyAgencyContractPolicy,
  updateMyAgencyContractPolicy
};
