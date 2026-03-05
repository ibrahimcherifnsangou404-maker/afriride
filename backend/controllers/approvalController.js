const { BookingApproval, Booking, Vehicle, User, Agency } = require('../models');

const approvalController = {
  // @desc    Lister les demandes d'approbation
  // @route   GET /api/manager/approvals
  // @access  Private (Manager/Admin)
  getApprovals: async (req, res) => {
    try {
      const status = req.query.status || 'pending';
      const bookingInclude = {
        model: Booking,
        as: 'booking',
        attributes: ['id', 'startDate', 'endDate', 'totalPrice', 'status', 'paymentStatus', 'createdAt'],
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'year', 'agencyId'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'] }],
          ...(req.user.role === 'manager' ? { where: { agencyId: req.user.agencyId } } : {})
        }]
      };

      const approvals = await BookingApproval.findAll({
        where: { status },
        include: [
          bookingInclude,
          { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'], required: false }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: approvals.length,
        data: approvals
      });
    } catch (error) {
      console.error('Erreur récupération approbations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des approbations',
        error: error.message
      });
    }
  },

  // @desc    Approuver une demande
  // @route   PUT /api/manager/approvals/:id/approve
  // @access  Private (Manager/Admin)
  approve: async (req, res) => {
    try {
      const approval = await BookingApproval.findByPk(req.params.id, {
        include: [{
          model: Booking,
          as: 'booking',
          include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'agencyId'] }]
        }]
      });

      if (!approval) {
        return res.status(404).json({ success: false, message: 'Demande introuvable' });
      }
      if (approval.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Cette demande est déjà traitée' });
      }
      if (req.user.role === 'manager' && approval.booking?.vehicle?.agencyId !== req.user.agencyId) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      approval.status = 'approved';
      approval.approverId = req.user.id;
      approval.decisionNote = req.body?.note || null;
      approval.decidedAt = new Date();
      await approval.save();

      res.status(200).json({
        success: true,
        message: 'Demande approuvée',
        data: approval
      });
    } catch (error) {
      console.error('Erreur approbation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'approbation',
        error: error.message
      });
    }
  },

  // @desc    Rejeter une demande
  // @route   PUT /api/manager/approvals/:id/reject
  // @access  Private (Manager/Admin)
  reject: async (req, res) => {
    try {
      const approval = await BookingApproval.findByPk(req.params.id, {
        include: [{
          model: Booking,
          as: 'booking',
          include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'agencyId'] }]
        }]
      });

      if (!approval) {
        return res.status(404).json({ success: false, message: 'Demande introuvable' });
      }
      if (approval.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Cette demande est déjà traitée' });
      }
      if (req.user.role === 'manager' && approval.booking?.vehicle?.agencyId !== req.user.agencyId) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      approval.status = 'rejected';
      approval.approverId = req.user.id;
      approval.decisionNote = req.body?.note || null;
      approval.decidedAt = new Date();
      await approval.save();

      res.status(200).json({
        success: true,
        message: 'Demande rejetée',
        data: approval
      });
    } catch (error) {
      console.error('Erreur rejet approbation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet',
        error: error.message
      });
    }
  }
};

module.exports = approvalController;
