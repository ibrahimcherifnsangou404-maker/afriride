const { Vehicle, Agency, Category, Booking } = require('../models');
const { Op } = require('sequelize');
const { getPendingThresholdDate } = require('../services/bookingAvailabilityService');
const { uploadVehicleImage } = require('../services/cloudinaryService');

const isAgencyVerified = (agency) => agency?.verificationStatus === 'verified';

// @desc    RÃ©cupÃ©rer tous les vÃ©hicules avec filtres
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const {
      category,
      agency,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      search,
      startDate,
      endDate,
      page = '1',
      limit = '12'
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 48);
    const offset = (pageNumber - 1) * pageSize;

    // Construire les conditions de recherche
    let whereClause = { isAvailable: true };

    if (category) {
      whereClause.categoryId = category;
    }

    if (agency) {
      whereClause.agencyId = agency;
    }

    if (minPrice || maxPrice) {
      whereClause.pricePerDay = {};
      if (minPrice) whereClause.pricePerDay[Op.gte] = minPrice;
      if (maxPrice) whereClause.pricePerDay[Op.lte] = maxPrice;
    }

    if (transmission) {
      whereClause.transmission = transmission;
    }

    if (fuelType) {
      whereClause.fuelType = fuelType;
    }

    if (search) {
      whereClause[Op.or] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // ðŸ†• Filtrage par disponibilitÃ© selon les dates
    // Si des dates sont fournies, exclure les vÃ©hicules ayant des rÃ©servations chevauchantes
    let excludedVehicleIds = [];

    if (startDate && endDate) {
      const requestedStart = new Date(startDate);
      const requestedEnd = new Date(endDate);

      // Valider les dates
      if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Dates invalides. Utilisez le format YYYY-MM-DD.'
        });
      }

      if (requestedStart >= requestedEnd) {
        return res.status(400).json({
          success: false,
          message: 'La date de dÃ©but doit Ãªtre antÃ©rieure Ã  la date de fin.'
        });
      }

      const pendingThreshold = getPendingThresholdDate();

      // Trouver les rÃ©servations qui chevauchent la pÃ©riode demandÃ©e.
      // On utilise des intervalles semi-ouverts pour autoriser les reservations consecutives.
      const overlappingBookings = await Booking.findAll({
        where: {
          startDate: {
            [Op.lt]: requestedEnd
          },
          endDate: {
            [Op.gt]: requestedStart
          },
          [Op.or]: [
            {
              status: {
                [Op.in]: ['confirmed', 'in_progress']
              }
            },
            {
              status: 'pending',
              paymentStatus: 'pending',
              createdAt: {
                [Op.gte]: pendingThreshold
              }
            }
          ]
        },
        attributes: ['vehicleId']
      });

      // Extraire les IDs des vÃ©hicules Ã  exclure
      excludedVehicleIds = overlappingBookings.map(booking => booking.vehicleId);

      // Ajouter l'exclusion Ã  la clause where si des vÃ©hicules sont Ã  exclure
      if (excludedVehicleIds.length > 0) {
        whereClause.id = {
          [Op.notIn]: excludedVehicleIds
        };
      }
    }

    // RÃ©cupÃ©rer les vÃ©hicules
    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name', 'phone', 'address'],
          where: { verificationStatus: 'verified', isActive: true }
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total: count,
      data: vehicles,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems: count,
        totalPages: Math.max(Math.ceil(count / pageSize), 1),
        hasNextPage: offset + vehicles.length < count,
        hasPrevPage: pageNumber > 1
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        excludedVehicles: excludedVehicleIds.length
      }
    });
  } catch (error) {
    console.error('Erreur rÃ©cupÃ©ration vÃ©hicules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration des vÃ©hicules',
      error: error.message
    });
  }
};

// @desc    RÃ©cupÃ©rer un vÃ©hicule par ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name', 'phone', 'email', 'address']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'VÃ©hicule non trouvÃ©'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Erreur rÃ©cupÃ©ration vÃ©hicule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration du vÃ©hicule',
      error: error.message
    });
  }
};

// @desc    CrÃ©er un vÃ©hicule (Gestionnaire uniquement)
// @route   POST /api/vehicles
// @access  Private (Manager/Admin)
const createVehicle = async (req, res) => {
  try {

    // VÃ©rifier si req.body existe
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnÃ©e reÃ§ue. VÃ©rifiez le format de la requÃªte.'
      });
    }

    // Les donnÃ©es viennent de req.body avec multer
    const brand = req.body.brand;
    const model = req.body.model;
    const year = req.body.year;
    const licensePlate = req.body.licensePlate;
    const color = req.body.color;
    const seats = req.body.seats;
    const transmission = req.body.transmission;
    const fuelType = req.body.fuelType;
    const pricePerDay = req.body.pricePerDay;
    const features = req.body.features;
    const categoryId = req.body.categoryId;

    console.log('Body reÃ§u:', req.body);
    console.log('Fichiers reÃ§us:', req.files);

    // VÃ©rifier que tous les champs obligatoires sont remplis
    if (!brand || !model || !year || !licensePlate || !pricePerDay || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    // RÃ©cupÃ©rer l'agence de l'utilisateur (gestionnaire)
    const agencyId = req.user.agencyId;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez Ãªtre associÃ© Ã  une agence pour ajouter un vÃ©hicule'
      });
    }

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable'
      });
    }

    // VÃ©rifier que la plaque d'immatriculation n'existe pas dÃ©jÃ 
    const existingVehicle = await Vehicle.findOne({ where: { licensePlate } });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Cette plaque d\'immatriculation existe dÃ©jÃ '
      });
    }

    // Traiter les images uploadÃ©es
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(async (file) => {
          const uploadResult = await uploadVehicleImage(file);
          return uploadResult?.secure_url || `/uploads/vehicles/${file.filename}`;
        })
      );
    }

    // Traiter les features (si c'est une chaÃ®ne JSON)
    let featuresArray = [];
    if (features) {
      try {
        featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (error) {
        featuresArray = [];
      }
    }

    // CrÃ©er le vÃ©hicule
    const vehicle = await Vehicle.create({
      brand,
      model,
      year: parseInt(year),
      licensePlate,
      color: color || null,
      seats: parseInt(seats) || 5,
      transmission: transmission || 'manual',
      fuelType: fuelType || 'petrol',
      pricePerDay: parseFloat(pricePerDay),
      images,
      features: featuresArray,
      isAvailable: isAgencyVerified(agency),
      agencyId,
      categoryId
    });

    res.status(201).json({
      success: true,
      message: isAgencyVerified(agency)
        ? 'VÃ©hicule crÃ©Ã© avec succÃ¨s'
        : 'VÃ©hicule enregistrÃ© en brouillon. La publication sera possible aprÃ¨s validation KYC de l\'agence.',
      data: vehicle
    });
  } catch (error) {
    console.error('Erreur crÃ©ation vÃ©hicule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la crÃ©ation du vÃ©hicule',
      error: error.message
    });
  }
};

// @desc    Mettre Ã  jour un vÃ©hicule
// @route   PUT /api/vehicles/:id
// @access  Private (Manager/Admin)
const updateVehicle = async (req, res) => {
  try {
    console.log('Body reÃ§u pour update:', req.body);
    console.log('Fichiers reÃ§us pour update:', req.files);

    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'VÃ©hicule non trouvÃ©'
      });
    }

    // VÃ©rifier que le gestionnaire gÃ¨re bien ce vÃ©hicule
    if (req.user.role === 'manager' && vehicle.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  modifier ce vÃ©hicule'
      });
    }

    const agency = await Agency.findByPk(vehicle.agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agence introuvable pour ce vÃ©hicule'
      });
    }

    // Extraire les donnÃ©es
    const {
      brand,
      model,
      year,
      licensePlate,
      color,
      seats,
      transmission,
      fuelType,
      pricePerDay,
      features,
      categoryId,
      isAvailable,
      existingImages // Images existantes Ã  conserver
    } = req.body;

    // GÃ©rer les nouvelles images
    let newImages = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      newImages = await Promise.all(
        req.files.map(async (file) => {
          const uploadResult = await uploadVehicleImage(file);
          return uploadResult?.secure_url || `/uploads/vehicles/${file.filename}`;
        })
      );
    }

    // Combiner images existantes + nouvelles images
    let allImages = [];
    if (existingImages) {
      try {
        const existing = typeof existingImages === 'string'
          ? JSON.parse(existingImages)
          : existingImages;
        allImages = Array.isArray(existing) ? existing : [];
      } catch (error) {
        allImages = [];
      }
    }
    allImages = [...allImages, ...newImages];

    // Traiter les features
    let featuresArray = vehicle.features || [];
    if (features) {
      try {
        featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (error) {
        featuresArray = vehicle.features || [];
      }
    }

    // Mettre Ã  jour le vÃ©hicule
    if (isAvailable !== undefined && isAvailable === 'true' && !isAgencyVerified(agency)) {
      return res.status(403).json({
        success: false,
        message: 'Publication impossible tant que l\'agence n\'est pas vÃ©rifiÃ©e'
      });
    }

    await vehicle.update({
      brand: brand || vehicle.brand,
      model: model || vehicle.model,
      year: year ? parseInt(year) : vehicle.year,
      licensePlate: licensePlate || vehicle.licensePlate,
      color: color !== undefined ? color : vehicle.color,
      seats: seats ? parseInt(seats) : vehicle.seats,
      transmission: transmission || vehicle.transmission,
      fuelType: fuelType || vehicle.fuelType,
      pricePerDay: pricePerDay ? parseFloat(pricePerDay) : vehicle.pricePerDay,
      categoryId: categoryId || vehicle.categoryId,
      isAvailable: isAvailable !== undefined
        ? (isAvailable === 'true' && isAgencyVerified(agency))
        : vehicle.isAvailable,
      images: allImages,
      features: featuresArray
    });

    res.status(200).json({
      success: true,
      message: 'VÃ©hicule mis Ã  jour avec succÃ¨s',
      data: vehicle
    });
  } catch (error) {
    console.error('Erreur mise Ã  jour vÃ©hicule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise Ã  jour du vÃ©hicule',
      error: error.message
    });
  }
};

// @desc    Supprimer un vÃ©hicule
// @route   DELETE /api/vehicles/:id
// @access  Private (Manager/Admin)
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'VÃ©hicule non trouvÃ©'
      });
    }

    // VÃ©rifier que le gestionnaire gÃ¨re bien ce vÃ©hicule
    if (req.user.role === 'manager' && vehicle.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  supprimer ce vÃ©hicule'
      });
    }

    await vehicle.destroy();

    res.status(200).json({
      success: true,
      message: 'VÃ©hicule supprimÃ© avec succÃ¨s'
    });
  } catch (error) {
    console.error('Erreur suppression vÃ©hicule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du vÃ©hicule',
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};


