const { Contract, Booking, Payment, User, Agency, Vehicle } = require('../models');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const notificationService = require('../services/notificationService');
const contractGeneratorService = require('../services/contractGeneratorService');

// Générer un numéro de contrat unique
const generateContractNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `CNT-${year}${month}${day}-${random}`;
};

// @desc    Créer un contrat
// @route   POST /api/contracts
// @access  Private (Manager/Admin)
const createContract = async (req, res) => {
  try {
    const {
      bookingId,
      paymentId,
      contractType = 'rental',
      terms,
      paymentTerms,
      signatureRequired = true,
      notes
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de la réservation est obligatoire'
      });
    }

    // Récupérer la réservation avec les relations
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'user' },
        { model: Vehicle, as: 'vehicle', include: [{ model: Agency, as: 'agency' }] }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'manager' && booking.vehicle.agency.id !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Créer le contrat
    const contract = await Contract.create({
      contractNumber: generateContractNumber(),
      status: 'draft',
      contractType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      terms: terms || `Contrat de location de ${booking.vehicle.brand} ${booking.vehicle.model} du ${booking.startDate} au ${booking.endDate}`,
      paymentTerms: paymentTerms || 'Le paiement doit être effectué avant la prise de possession du véhicule.',
      totalAmount: booking.totalPrice,
      signatureRequired,
      notes,
      bookingId,
      paymentId: paymentId || null,
      userId: booking.userId,
      agencyId: booking.vehicle.agencyId
    });

    res.status(201).json({
      success: true,
      message: 'Contrat créé avec succès',
      data: contract
    });
  } catch (error) {
    console.error('Erreur création contrat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du contrat',
      error: error.message
    });
  }
};

// @desc    Récupérer tous les contrats d'une réservation
// @route   GET /api/contracts/booking/:bookingId
// @access  Private
const getContractsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const contracts = await Contract.findAll({
      where: { bookingId },
      include: [
        { model: Booking, as: 'booking' },
        { model: Payment, as: 'payment' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Agency, as: 'agency', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  } catch (error) {
    console.error('Erreur récupération contrats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contrats',
      error: error.message
    });
  }
};

// @desc    Récupérer un contrat par ID
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: Booking, as: 'booking', include: [{ model: Vehicle, as: 'vehicle' }] },
        { model: Payment, as: 'payment' },
        { model: User, as: 'user' },
        { model: Agency, as: 'agency' }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé'
      });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'client' && contract.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (req.user.role === 'manager' && contract.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Erreur récupération contrat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contrat',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un contrat
// @route   PUT /api/contracts/:id
// @access  Private (Manager/Admin)
const updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé'
      });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'manager' && contract.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const {
      status,
      terms,
      paymentTerms,
      documentUrl,
      clientSignatureDate,
      agencySignatureDate,
      notes
    } = req.body;

    // Mettre à jour le contrat
    await contract.update({
      status: status || contract.status,
      terms: terms || contract.terms,
      paymentTerms: paymentTerms || contract.paymentTerms,
      documentUrl: documentUrl || contract.documentUrl,
      clientSignatureDate: clientSignatureDate || contract.clientSignatureDate,
      agencySignatureDate: agencySignatureDate || contract.agencySignatureDate,
      notes: notes || contract.notes
    });

    res.status(200).json({
      success: true,
      message: 'Contrat mis à jour avec succès',
      data: contract
    });
  } catch (error) {
    console.error('Erreur mise à jour contrat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du contrat',
      error: error.message
    });
  }
};

// @desc    Signer un contrat (client)
// @route   POST /api/contracts/:id/sign-client
// @access  Private (Client)
const signContractAsClient = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: Agency, as: 'agency' }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé'
      });
    }

    // Vérifier que c'est bien le client du contrat
    if (contract.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Signer
    await contract.update({
      clientSignatureDate: new Date(),
      status: contract.agencySignatureDate ? 'active' : contract.status
    });

    // 🆕 Envoyer email de notification de signature
    emailService.sendSignatureNotificationEmail(contract, contract.user, 'client').catch(err =>
      console.error('Erreur envoi email signature:', err.message)
    );

    // 🆕 SMS notification
    smsService.sendSignaturePendingSMS(contract.user.phone, contract.contractNumber).catch(err =>
      console.error('Erreur envoi SMS:', err.message)
    );

    // 🆕 Notification push
    if (contract.agencySignatureDate) {
      notificationService.notifyContractComplete(contract.userId, contract.contractNumber).catch(err =>
        console.error('Erreur notification push:', err.message)
      );
    } else {
      notificationService.notifySignaturePending(contract.agencyId, contract.contractNumber, 'l\'agence').catch(err =>
        console.error('Erreur notification push:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Contrat signé par le client',
      data: contract
    });
  } catch (error) {
    console.error('Erreur signature contrat client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la signature du contrat',
      error: error.message
    });
  }
};

// @desc    Signer un contrat (agence)
// @route   POST /api/contracts/:id/sign-agency
// @access  Private (Manager/Admin)
const signContractAsAgency = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: Agency, as: 'agency' }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé'
      });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'manager' && contract.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Signer
    await contract.update({
      agencySignatureDate: new Date(),
      status: contract.clientSignatureDate ? 'active' : contract.status
    });

    // 🆕 Envoyer email de notification de signature
    emailService.sendSignatureNotificationEmail(contract, contract.user, 'agency').catch(err =>
      console.error('Erreur envoi email signature:', err.message)
    );

    // 🆕 SMS notification
    smsService.sendSignaturePendingSMS(contract.user.phone, contract.contractNumber).catch(err =>
      console.error('Erreur envoi SMS:', err.message)
    );

    // 🆕 Notification push
    if (contract.clientSignatureDate) {
      notificationService.notifyContractComplete(contract.userId, contract.contractNumber).catch(err =>
        console.error('Erreur notification push:', err.message)
      );
    } else {
      notificationService.notifySignaturePending(contract.userId, contract.contractNumber, 'du client').catch(err =>
        console.error('Erreur notification push:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Contrat signé par l\'agence',
      data: contract
    });
  } catch (error) {
    console.error('Erreur signature contrat agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la signature du contrat',
      error: error.message
    });
  }
};

// @desc    Supprimer un contrat
// @route   DELETE /api/contracts/:id
// @access  Private (Manager/Admin)
const deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé'
      });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'manager' && contract.agencyId !== req.user.agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await contract.destroy();

    res.status(200).json({
      success: true,
      message: 'Contrat supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression contrat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du contrat',
      error: error.message
    });
  }
};

// 🆕 @desc    Générer le contenu d'un contrat dynamiquement
// 🆕 @route   POST /api/contracts/generate
// 🆕 @access  Private (Client)
const generateContractContent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de la réservation est obligatoire'
      });
    }

    // 🆕 Débugger - vérifier que req.user existe
    if (!req.user) {
      console.error('❌ req.user is undefined');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    console.log('✅ User authenticated:', req.user.id, req.user.role);

    // Vérifier que la réservation appartient à l'utilisateur
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    if (booking.userId !== req.user.id) {
      console.error(`❌ Booking ${bookingId} does not belong to user ${req.user.id}. Owner: ${booking.userId}`);
      return res.status(403).json({
        success: false,
        message: 'Cette réservation ne vous appartient pas'
      });
    }

    console.log('✅ Booking belongs to user. Generating contract...');

    // Générer le contenu du contrat
    const contractContent = await contractGeneratorService.generateContractContent(bookingId);

    res.status(200).json({
      success: true,
      message: 'Contrat généré avec succès',
      data: contractContent
    });
  } catch (error) {
    console.error('❌ Erreur génération contrat:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du contrat',
      error: error.message
    });
  }
};

// 🆕 @desc    Accepter le contrat (mettre à jour le flag dans Booking)
// 🆕 @route   POST /api/bookings/:bookingId/accept-contract
// 🆕 @access  Private (Client)
const acceptContract = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'user' },
        { model: Vehicle, as: 'vehicle', include: [{ model: Agency, as: 'agency' }] }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Mettre à jour le statut d'acceptation du contrat
    const updatedBooking = await booking.update({
      contractAccepted: true,
      contractAcceptedDate: new Date()
    });

    console.log('✅ Contrat accepté par l\'utilisateur:', req.user.id);

    // 🆕 Envoyer notification par email (optionnel)
    if (emailService && typeof emailService.sendContractAcceptanceNotification === 'function') {
      emailService.sendContractAcceptanceNotification(booking.user, booking, booking.vehicle.agency).catch(err =>
        console.error('⚠️ Erreur envoi email acceptation contrat:', err.message)
      );
    }

    // 🆕 Notification push (optionnel)
    if (notificationService && typeof notificationService.notifyContractAccepted === 'function') {
      notificationService.notifyContractAccepted(booking.userId, booking.id).catch(err =>
        console.error('⚠️ Erreur notification push:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Contrat accepté avec succès',
      data: updatedBooking
    });
  } catch (error) {
    console.error('❌ Erreur acceptation contrat:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du contrat',
      error: error.message
    });
  }
};

module.exports = {
  createContract,
  getContractsByBooking,
  getContractById,
  updateContract,
  signContractAsClient,
  signContractAsAgency,
  deleteContract,
  generateContractContent,
  acceptContract
};
