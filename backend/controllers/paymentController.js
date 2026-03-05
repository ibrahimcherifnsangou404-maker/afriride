const { Payment, Booking, Vehicle, Contract, Agency, User, BookingApproval } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const emailService = require('../services/emailService');
const { HOLD_MINUTES, getPendingThresholdDate } = require('../services/bookingAvailabilityService');

const generateContractNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `CNT-${year}${month}${day}-${random}`;
};

const getMonthlyBounds = (month, year) => {
  const now = new Date();
  const y = Number(year) || now.getFullYear();
  const m = Number(month) || now.getMonth() + 1;
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { from, to, month: m, year: y };
};

const getConsolidatedInvoicesData = async (req, { month, year, q = '', userId = '' }) => {
  const { from, to, month: normalizedMonth, year: normalizedYear } = getMonthlyBounds(month, year);

  const include = [
    {
      model: Booking,
      as: 'booking',
      attributes: ['id', 'startDate', 'endDate', 'status'],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'licensePlate'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }]
        }
      ],
      required: true
    },
    {
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      required: true
    }
  ];

  const where = {
    createdAt: {
      [Op.gte]: from,
      [Op.lte]: to
    },
    status: {
      [Op.in]: ['completed', 'refunded']
    }
  };

  if (req.user.role === 'client') {
    where.userId = req.user.id;
  } else if (req.user.role === 'manager') {
    include[0].include[0].where = { agencyId: req.user.agencyId };
    include[0].include[0].required = true;
  }

  if (userId && (req.user.role === 'admin' || req.user.id === userId)) {
    where.userId = userId;
  }

  if (q && q.trim()) {
    const search = q.trim().toLowerCase();
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('user.firstName')), { [Op.like]: `%${search}%` }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('user.lastName')), { [Op.like]: `%${search}%` }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('user.email')), { [Op.like]: `%${search}%` }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('booking->vehicle->agency.name')), { [Op.like]: `%${search}%` })
      ]
    });
  }

  const payments = await Payment.findAll({
    where,
    include,
    order: [['createdAt', 'DESC']]
  });

  const grouped = new Map();

  for (const payment of payments) {
    const key = payment.userId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        userId: payment.userId,
        user: payment.user,
        period: `${normalizedYear}-${String(normalizedMonth).padStart(2, '0')}`,
        invoiceNumber: `B2B-${normalizedYear}${String(normalizedMonth).padStart(2, '0')}-${String(payment.userId).slice(0, 8).toUpperCase()}`,
        totalPaid: 0,
        totalRefunded: 0,
        netTotal: 0,
        paymentCount: 0,
        bookingIds: new Set(),
        lines: []
      });
    }

    const group = grouped.get(key);
    const amount = Number(payment.amount || 0);
    group.paymentCount += 1;
    if (payment.status === 'completed') {
      group.totalPaid += amount;
    } else if (payment.status === 'refunded') {
      group.totalRefunded += amount;
    }
    group.bookingIds.add(payment.booking?.id);
    group.lines.push({
      paymentId: payment.id,
      bookingId: payment.booking?.id,
      vehicle: payment.booking?.vehicle ? {
        brand: payment.booking.vehicle.brand,
        model: payment.booking.vehicle.model,
        licensePlate: payment.booking.vehicle.licensePlate
      } : null,
      agency: payment.booking?.vehicle?.agency ? {
        id: payment.booking.vehicle.agency.id,
        name: payment.booking.vehicle.agency.name
      } : null,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      amount: amount,
      createdAt: payment.createdAt
    });
  }

  const consolidated = Array.from(grouped.values()).map((group) => ({
    ...group,
    netTotal: group.totalPaid - group.totalRefunded,
    bookingCount: group.bookingIds.size,
    bookingIds: undefined
  }));

  return {
    period: {
      month: normalizedMonth,
      year: normalizedYear,
      from,
      to
    },
    data: consolidated
  };
};

const paymentController = {
  // Lister les factures/reçus selon le rôle
  getInvoices: async (req, res) => {
    try {
      const { status, paymentMethod, q, startDate, endDate } = req.query;
      const paymentWhere = {};
      const bookingWhere = {};

      if (status) paymentWhere.status = status;
      if (paymentMethod) paymentWhere.paymentMethod = paymentMethod;

      if (startDate || endDate) {
        paymentWhere.createdAt = {};
        if (startDate) paymentWhere.createdAt[Op.gte] = new Date(startDate);
        if (endDate) paymentWhere.createdAt[Op.lte] = new Date(endDate);
      }

      if (q && q.trim()) {
        bookingWhere[Op.or] = [
          { '$booking.vehicle.brand$': { [Op.like]: `%${q.trim()}%` } },
          { '$booking.vehicle.model$': { [Op.like]: `%${q.trim()}%` } },
          { '$user.firstName$': { [Op.like]: `%${q.trim()}%` } },
          { '$user.lastName$': { [Op.like]: `%${q.trim()}%` } }
        ];
      }

      const include = [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'startDate', 'endDate', 'status'],
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'brand', 'model', 'year', 'licensePlate'],
              include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'] }]
            }
          ],
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true
        }
      ];

      if (req.user.role === 'client') {
        paymentWhere.userId = req.user.id;
      } else if (req.user.role === 'manager') {
        include[0].include[0].where = { agencyId: req.user.agencyId };
        include[0].include[0].required = true;
      }

      const payments = await Payment.findAll({
        where: { ...paymentWhere, ...bookingWhere },
        include,
        order: [['createdAt', 'DESC']]
      });

      const normalized = payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
        booking: p.booking,
        user: p.user,
        invoiceNumber: `INV-${String(p.id).slice(0, 8).toUpperCase()}`
      }));

      res.status(200).json({
        success: true,
        count: normalized.length,
        data: normalized
      });
    } catch (error) {
      console.error('Erreur récupération factures:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des factures',
        error: error.message
      });
    }
  },

  // Initier un paiement
  initiatePayment: async (req, res) => {
    try {
      const { bookingId, amount, paymentMethod, phoneNumber } = req.body;
      const userId = req.user.id;

      // Vérifier si la réservation existe
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cette reservation ne peut plus etre payee'
        });
      }

      const latestApproval = await BookingApproval.findOne({
        where: { bookingId },
        order: [['createdAt', 'DESC']]
      });
      if (latestApproval && latestApproval.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: latestApproval.status === 'rejected'
            ? 'Cette reservation a ete rejetee par le manager'
            : 'Cette reservation attend une approbation manager'
        });
      }

      const pendingThreshold = getPendingThresholdDate();
      if (
        booking.status === 'pending' &&
        booking.paymentStatus === 'pending' &&
        new Date(booking.createdAt) < pendingThreshold
      ) {
        booking.status = 'cancelled';
        booking.paymentStatus = 'failed';
        booking.notes = 'Reservation annulee automatiquement (verrou expire).';
        await booking.save();
        return res.status(409).json({
          success: false,
          message: `Le verrou de reservation a expire (${HOLD_MINUTES} min). Veuillez relancer la reservation.`
        });
      }

      // Créer l'enregistrement de paiement
      const payment = await Payment.create({
        amount,
        paymentMethod,
        phoneNumber,
        bookingId,
        userId,
        status: 'pending',
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Paiement initié avec succès'
      });

    } catch (error) {
      console.error('Erreur initiation paiement:', error);
      res.status(500).json({ message: 'Erreur lors de l\'initiation du paiement' });
    }
  },

  // Simuler le traitement du paiement
  processPayment: async (req, res) => {
    const { paymentId, simulateStatus } = req.body;
    const t = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, { transaction: t });
      if (!payment) {
        await t.rollback();
        return res.status(404).json({ message: 'Paiement non trouvé' });
      }

      // Simulation de délai de traitement (2 secondes)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusKey = (simulateStatus || 'success').toLowerCase();
      const isSuccess = statusKey === 'success';
      const isRefund = statusKey === 'refunded';
      const isFailure = ['failed', 'expired', 'cancelled'].includes(statusKey);

      // Mise à jour du paiement (mapping vers enum existant)
      if (isSuccess) {
        payment.status = 'completed';
      } else if (isRefund) {
        payment.status = 'refunded';
      } else if (isFailure) {
        payment.status = 'failed';
      } else {
        payment.status = 'failed';
      }

      await payment.save({ transaction: t });

      // Mise à jour de la réservation
      const booking = await Booking.findByPk(payment.bookingId, {
        include: [{ model: Vehicle, as: 'vehicle', include: [{ model: Agency, as: 'agency' }] }],
        transaction: t
      });

      if (booking) {
        const latestApproval = await BookingApproval.findOne({
          where: { bookingId: booking.id },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        if (latestApproval && latestApproval.status !== 'approved') {
          payment.status = 'failed';
          await payment.save({ transaction: t });
          await t.commit();
          return res.status(403).json({
            success: false,
            message: latestApproval.status === 'rejected'
              ? 'Cette reservation a ete rejetee par le manager'
              : 'Cette reservation attend une approbation manager'
          });
        }

        const pendingThreshold = getPendingThresholdDate();
        if (
          booking.status === 'pending' &&
          booking.paymentStatus === 'pending' &&
          new Date(booking.createdAt) < pendingThreshold
        ) {
          booking.status = 'cancelled';
          booking.paymentStatus = 'failed';
          booking.notes = 'Reservation annulee automatiquement (verrou expire).';
          await booking.save({ transaction: t });
          payment.status = 'failed';
          await payment.save({ transaction: t });
          await t.commit();
          return res.status(409).json({
            success: false,
            message: `Le verrou de reservation a expire (${HOLD_MINUTES} min). Reservation annulee.`
          });
        }

        if (isSuccess) {
          booking.paymentStatus = 'paid';
          booking.paymentMethod = payment.paymentMethod;
          booking.status = 'confirmed'; // Confirmer la réservation
        } else if (isRefund) {
          booking.paymentStatus = 'refunded';
          booking.status = 'cancelled';
        } else {
          booking.paymentStatus = 'failed';
          // Laisser la réservation en pending pour permettre un nouveau paiement
        }
        await booking.save({ transaction: t });

        let contract = null;
        if (isSuccess) {
          const draftQuote = await Contract.findOne({
            where: {
              bookingId: booking.id,
              paymentId: null,
              status: 'draft'
            },
            order: [['createdAt', 'DESC']],
            transaction: t
          });

          if (draftQuote) {
            await draftQuote.update({
              contractType: 'rental',
              paymentId: payment.id,
              signatureRequired: true,
              terms: `Contrat de location confirme pour ${booking.vehicle.brand} ${booking.vehicle.model}`,
              paymentTerms: 'Paiement effectue en totalite.',
              notes: 'Converti automatiquement depuis devis pre-paiement.'
            }, { transaction: t });
            contract = draftQuote;
          } else {
            contract = await Contract.create({
              contractNumber: generateContractNumber(),
              status: 'draft',
              contractType: 'rental',
              startDate: booking.startDate,
              endDate: booking.endDate,
              terms: `Contrat de location automatique pour ${booking.vehicle.brand} ${booking.vehicle.model}`,
              paymentTerms: 'Paiement effectue en totalite.',
              totalAmount: booking.totalPrice,
              signatureRequired: true,
              notes: 'Contrat genere apres paiement (devis introuvable).',
              bookingId: booking.id,
              paymentId: payment.id,
              userId: booking.userId,
              agencyId: booking.vehicle.agencyId
            }, { transaction: t });
          }
        }

        await t.commit();

        res.json({
          success: true,
          data: payment,
          status: isSuccess ? 'paid' : isRefund ? 'refunded' : 'failed',
          contractId: contract?.id || null,
          message: isSuccess
            ? 'Paiement traite et contrat finalise'
            : isRefund
              ? 'Paiement rembourse'
              : 'Paiement echoue'
        });

        if (isSuccess) {
          // Envoyer le reçu par email (non bloquant)
          try {
            const user = await User.findByPk(booking.userId);
            const receiptBuffer = await paymentController.generateReceiptBuffer(payment, booking, booking.vehicle, booking.vehicle?.agency, user);
            await emailService.sendPaymentReceiptEmail(user, payment, booking, receiptBuffer);
          } catch (emailErr) {
            console.warn('⚠️ Envoi reçu email échoué:', emailErr.message);
          }
        }
      } else {
        await t.commit();
        res.json({ success: true, data: payment, message: 'Paiement traité (Booking introuvable)' });
      }

    } catch (error) {
      await t.rollback();
      console.error('Erreur traitement paiement:', error);
      res.status(500).json({ message: 'Erreur lors du traitement du paiement' });
    }
  },

  // Obtenir le statut d'un paiement
  getPaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await Payment.findByPk(id);

      if (!payment) {
        return res.status(404).json({ message: 'Paiement non trouvé' });
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Erreur statut paiement:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération du statut' });
    }
  },

  // Consolider les factures B2B par client pour un mois
  getConsolidatedInvoices: async (req, res) => {
    try {
      const { month, year, q, userId } = req.query;
      const result = await getConsolidatedInvoicesData(req, { month, year, q, userId });
      res.status(200).json({
        success: true,
        count: result.data.length,
        period: result.period,
        data: result.data
      });
    } catch (error) {
      console.error('Erreur consolidation factures B2B:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la consolidation des factures',
        error: error.message
      });
    }
  },

  // Telecharger une facture B2B consolidee (PDF)
  downloadConsolidatedInvoice: async (req, res) => {
    try {
      const { userId } = req.params;
      const { month, year } = req.query;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId requis' });
      }

      if (req.user.role === 'client' && req.user.id !== userId) {
        return res.status(403).json({ success: false, message: 'Acces refuse' });
      }

      const result = await getConsolidatedInvoicesData(req, { month, year, userId });
      const invoice = result.data.find((item) => item.userId === userId);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Facture consolidee introuvable' });
      }

      const periodLabel = `${result.period.year}-${String(result.period.month).padStart(2, '0')}`;
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=AfriRide_B2B_${invoice.invoiceNumber}.pdf`);

      doc.fontSize(20).text('AfriRide - Facture B2B Consolidee', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(`Numero: ${invoice.invoiceNumber}`);
      doc.text(`Periode: ${periodLabel}`);
      doc.text(`Client: ${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`.trim());
      doc.text(`Email: ${invoice.user?.email || '-'}`);
      doc.moveDown();
      doc.text(`Total paye: ${Number(invoice.totalPaid).toLocaleString('fr-FR')} FCFA`);
      doc.text(`Total rembourse: ${Number(invoice.totalRefunded).toLocaleString('fr-FR')} FCFA`);
      doc.font('Helvetica-Bold').text(`Net: ${Number(invoice.netTotal).toLocaleString('fr-FR')} FCFA`);
      doc.font('Helvetica').moveDown();
      doc.text(`Nombre de paiements: ${invoice.paymentCount}`);
      doc.text(`Nombre de reservations: ${invoice.bookingCount}`);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Lignes de facturation');
      doc.moveDown(0.5);
      doc.font('Helvetica');

      invoice.lines.slice(0, 40).forEach((line, index) => {
        const vehicle = line.vehicle ? `${line.vehicle.brand} ${line.vehicle.model}` : 'Vehicule';
        const agency = line.agency?.name || '-';
        const amount = Number(line.amount).toLocaleString('fr-FR');
        const status = line.status;
        const date = new Date(line.createdAt).toLocaleDateString('fr-FR');
        doc.text(`${index + 1}. ${date} | ${vehicle} | ${agency} | ${status} | ${amount} FCFA`);
      });

      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text('Document genere automatiquement par AfriRide.', { align: 'center' });
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error('Erreur export facture B2B consolidee:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la generation de la facture consolidee',
        error: error.message
      });
    }
  },

  // Générer et télécharger le reçu (PDF)
  downloadReceipt: async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Vehicle,
                as: 'vehicle',
                include: [{ model: Agency, as: 'agency', attributes: ['id', 'name', 'address', 'phone', 'email'] }]
              }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ message: 'Paiement non trouvé' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'manager' && payment.userId !== req.user.id) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const booking = payment.booking;
      const vehicle = booking?.vehicle;
      const agency = vehicle?.agency;
      const user = payment.user;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=AfriRide_Receipt_${payment.id}.pdf`);

      doc.fontSize(20).text('AfriRide - Reçu de paiement', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Reçu ID: ${payment.id}`);
      doc.text(`Transaction ID: ${payment.transactionId || '-'}`);
      doc.text(`Statut: ${payment.status}`);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleString('fr-FR')}`);
      doc.moveDown();

      doc.fontSize(14).text('Client', { underline: true });
      doc.fontSize(12).text(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
      doc.text(user?.email || '-');
      doc.moveDown();

      doc.fontSize(14).text('Véhicule', { underline: true });
      doc.fontSize(12).text(`${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim());
      doc.text(`Année: ${vehicle?.year || '-'}`);
      doc.moveDown();

      doc.fontSize(14).text('Réservation', { underline: true });
      doc.fontSize(12).text(`Du ${new Date(booking?.startDate).toLocaleDateString('fr-FR')} au ${new Date(booking?.endDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Total jours: ${booking?.totalDays || '-'}`);
      doc.moveDown();

      doc.fontSize(14).text('Agence', { underline: true });
      doc.fontSize(12).text(agency?.name || '-');
      if (agency?.address) doc.text(agency.address);
      if (agency?.phone) doc.text(agency.phone);
      if (agency?.email) doc.text(agency.email);
      doc.moveDown();

      doc.fontSize(14).text('Montant', { underline: true });
      doc.fontSize(16).text(`${Number(payment.amount || 0).toLocaleString('fr-FR')} FCFA`, { align: 'left' });
      doc.moveDown();

      doc.fontSize(10).fillColor('#555').text('Merci pour votre confiance.', { align: 'center' });

      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error('Erreur génération reçu:', error);
      res.status(500).json({ message: 'Erreur lors de la génération du reçu' });
    }
  },

  // Générer un reçu PDF en buffer (pour email)
  generateReceiptBuffer: async (payment, booking, vehicle, agency, user) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(20).text('AfriRide - Reçu de paiement', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Reçu ID: ${payment.id}`);
        doc.text(`Transaction ID: ${payment.transactionId || '-'}`);
        doc.text(`Statut: ${payment.status}`);
        doc.text(`Date: ${new Date(payment.createdAt).toLocaleString('fr-FR')}`);
        doc.moveDown();

        doc.fontSize(14).text('Client', { underline: true });
        doc.fontSize(12).text(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
        doc.text(user?.email || '-');
        doc.moveDown();

        doc.fontSize(14).text('Véhicule', { underline: true });
        doc.fontSize(12).text(`${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim());
        doc.text(`Année: ${vehicle?.year || '-'}`);
        doc.moveDown();

        doc.fontSize(14).text('Réservation', { underline: true });
        doc.fontSize(12).text(`Du ${new Date(booking?.startDate).toLocaleDateString('fr-FR')} au ${new Date(booking?.endDate).toLocaleDateString('fr-FR')}`);
        doc.text(`Total jours: ${booking?.totalDays || '-'}`);
        doc.moveDown();

        doc.fontSize(14).text('Agence', { underline: true });
        doc.fontSize(12).text(agency?.name || '-');
        if (agency?.address) doc.text(agency.address);
        if (agency?.phone) doc.text(agency.phone);
        if (agency?.email) doc.text(agency.email);
        doc.moveDown();

        doc.fontSize(14).text('Montant', { underline: true });
        doc.fontSize(16).text(`${Number(payment.amount || 0).toLocaleString('fr-FR')} FCFA`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(10).fillColor('#555').text('Merci pour votre confiance.', { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = paymentController;

