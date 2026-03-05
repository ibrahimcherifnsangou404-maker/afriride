const { Review, User, Vehicle, Booking } = require('../models');

// @desc    Créer un avis
// @route   POST /api/reviews
// @access  Private (Client)
const createReview = async (req, res) => {
  try {
    const { bookingId, vehicleId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!bookingId || !vehicleId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs obligatoires'
      });
    }

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Vérifier que la réservation est terminée
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Vous pouvez seulement laisser un avis après la fin de la location'
      });
    }

    // Vérifier si un avis existe déjà
    const existingReview = await Review.findOne({ where: { bookingId } });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour cette réservation'
      });
    }

    // Créer l'avis
    const review = await Review.create({
      userId,
      vehicleId,
      bookingId,
      rating,
      comment,
      isApproved: false // L'admin doit approuver
    });

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès. Il sera visible après modération.',
      data: review
    });
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis',
      error: error.message
    });
  }
};

// @desc    Récupérer les avis d'un véhicule
// @route   GET /api/reviews/vehicle/:vehicleId
// @access  Public
const getVehicleReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { 
        vehicleId: req.params.vehicleId,
        isApproved: true // Seulement les avis approuvés
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculer la note moyenne
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating: avgRating.toFixed(1),
      data: reviews
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les avis (Admin)
// @route   GET /api/reviews
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['brand', 'model', 'year']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
};

// @desc    Approuver un avis (Admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private (Admin)
const approveReview = async (req, res) => {
  try {
    console.log('DEBUG approveReview called - user:', req.user?.id, req.user?.role, 'reviewId:', req.params.id);
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    await review.update({ isApproved: true });

    res.status(200).json({
      success: true,
      message: 'Avis approuvé avec succès',
      data: review
    });
  } catch (error) {
    console.error('Erreur approbation avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de l\'avis',
      error: error.message
    });
  }
};

// @desc    Supprimer un avis (Admin)
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    await review.destroy();

    res.status(200).json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getVehicleReviews,
  getAllReviews,
  approveReview,
  deleteReview
};