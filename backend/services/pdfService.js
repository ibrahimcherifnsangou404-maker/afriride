const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const formatAmount = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const date = new Date(value);
  return withTime ? date.toLocaleString('fr-FR') : date.toLocaleDateString('fr-FR');
};

const paymentMethodLabels = {
  card: 'Carte bancaire',
  momo_mtn: 'MTN Mobile Money',
  momo_orange: 'Orange Money',
  cash: 'Especes'
};

const paymentStatusLabels = {
  completed: 'Paiement confirme',
  pending: 'Paiement en attente',
  failed: 'Paiement echoue',
  refunded: 'Paiement rembourse'
};

const drawRoundedBox = (doc, x, y, width, height, fillColor, strokeColor = null) => {
  doc.save();
  if (fillColor) {
    doc.fillColor(fillColor).roundedRect(x, y, width, height, 14).fill();
  }
  if (strokeColor) {
    doc.lineWidth(1).strokeColor(strokeColor).roundedRect(x, y, width, height, 14).stroke();
  }
  doc.restore();
};

const renderPaymentReceipt = (doc, { payment, booking, vehicle, agency, user }) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  const accent = '#0f766e';
  const dark = '#0f172a';
  const slate = '#475569';
  const lightBorder = '#dbe4ee';
  const soft = '#f8fafc';
  const statusBg = payment?.status === 'completed' ? '#ecfdf5' : '#f8fafc';
  const statusText = payment?.status === 'completed' ? '#047857' : '#334155';

  doc.rect(0, 0, pageWidth, 132).fill(dark);
  doc.save();
  doc.fillColor('#134e4a').circle(pageWidth - 70, 44, 55).fill();
  doc.fillColor('#0f766e').circle(pageWidth - 30, 96, 34).fill();
  doc.restore();

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('Recu de paiement', margin, 34);
  doc.font('Helvetica').fontSize(10).fillColor('#cbd5e1').text('AfriRide - Mobilite premium, paiement securise', margin, 62);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#99f6e4').text(`No ${String(payment?.id || '').slice(0, 8).toUpperCase()}`, margin, 82);

  drawRoundedBox(doc, margin, 150, contentWidth, 84, '#ffffff', lightBorder);
  drawRoundedBox(doc, margin + 18, 168, 140, 48, statusBg, null);
  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('STATUT', margin + 30, 178);
  doc.fillColor(statusText).font('Helvetica-Bold').fontSize(14).text(paymentStatusLabels[payment?.status] || String(payment?.status || '-'), margin + 30, 192);

  const summaryStartX = margin + 180;
  const summaryWidth = contentWidth - 198;
  const colWidth = summaryWidth / 3;

  [
    { label: 'Montant regle', value: formatAmount(payment?.amount) },
    { label: 'Date / heure', value: formatDate(payment?.createdAt, true) },
    { label: 'Methode', value: paymentMethodLabels[payment?.paymentMethod] || payment?.paymentMethod || '-' }
  ].forEach((item, index) => {
    const x = summaryStartX + (colWidth * index);
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text(item.label.toUpperCase(), x, 176, { width: colWidth - 12 });
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text(item.value, x, 192, { width: colWidth - 12 });
  });

  const drawInfoSection = (x, y, width, title, lines, tint = soft) => {
    const height = 118;
    drawRoundedBox(doc, x, y, width, height, tint, lightBorder);
    doc.fillColor(accent).font('Helvetica-Bold').fontSize(11).text(title, x + 16, y + 14);
    let lineY = y + 38;
    lines.forEach((line) => {
      doc.fillColor(slate).font('Helvetica').fontSize(10).text(line, x + 16, lineY, { width: width - 32 });
      lineY += 16;
    });
    return y + height + 14;
  };

  const colGap = 20;
  const colWidthBox = (contentWidth - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colWidthBox + colGap;
  const firstRowY = 258;

  const clientBottom = drawInfoSection(leftX, firstRowY, colWidthBox, 'Client', [
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '-',
    user?.email || '-',
    user?.phone || 'Telephone non renseigne'
  ]);

  const transactionBottom = drawInfoSection(rightX, firstRowY, colWidthBox, 'Transaction', [
    `Transaction ID: ${payment?.transactionId || '-'}`,
    `Reference reservation: ${String(booking?.id || '').slice(0, 8).toUpperCase() || '-'}`,
    `Statut reservation: ${booking?.status || '-'}`,
    `Paiement: ${paymentStatusLabels[payment?.status] || payment?.status || '-'}`
  ]);

  const secondRowY = Math.max(clientBottom, transactionBottom);

  const vehicleBottom = drawInfoSection(leftX, secondRowY, colWidthBox, 'Vehicule loue', [
    `${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim() || '-',
    `Annee: ${vehicle?.year || '-'}`,
    `Immatriculation: ${vehicle?.licensePlate || '-'}`,
    `Agence: ${agency?.name || '-'}`
  ], '#f0fdfa');

  const bookingBottom = drawInfoSection(rightX, secondRowY, colWidthBox, 'Reservation', [
    `Periode: du ${formatDate(booking?.startDate)} au ${formatDate(booking?.endDate)}`,
    `Duree: ${booking?.totalDays || '-'} jour(s)`,
    `Prix journalier: ${formatAmount(booking?.pricePerDay)}`,
    `Total reservation: ${formatAmount(booking?.finalPrice || booking?.totalPrice || payment?.amount)}`
  ]);

  const agencyTop = Math.max(vehicleBottom, bookingBottom);
  drawRoundedBox(doc, margin, agencyTop, contentWidth, 92, '#ffffff', lightBorder);
  doc.fillColor(accent).font('Helvetica-Bold').fontSize(11).text('Agence et assistance', margin + 18, agencyTop + 16);
  doc.fillColor(slate).font('Helvetica').fontSize(10)
    .text(agency?.name || '-', margin + 18, agencyTop + 40)
    .text(agency?.address || 'Adresse non renseignee', margin + 18, agencyTop + 56, { width: 250 })
    .text(agency?.phone || 'Telephone non renseigne', margin + 300, agencyTop + 40)
    .text(agency?.email || 'Email non renseigne', margin + 300, agencyTop + 56);

  const footerTop = agencyTop + 118;
  drawRoundedBox(doc, margin, footerTop, contentWidth, 74, '#f8fafc', lightBorder);
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(10).text('Merci pour votre confiance.', margin + 18, footerTop + 18);
  doc.fillColor(slate).font('Helvetica').fontSize(9).text(
    'Ce recu confirme l encaissement du paiement par AfriRide. Conservez-le avec votre contrat de location pour tout suivi, remboursement ou reclamation.',
    margin + 18,
    footerTop + 36,
    { width: contentWidth - 36 }
  );

  doc.fontSize(8).fillColor('#94a3b8').text(
    `Document genere le ${formatDate(new Date(), true)} - AfriRide`,
    margin,
    pageHeight - 32,
    { width: contentWidth, align: 'center' }
  );
};

const pdfService = {
  generateContractPDF: async (contract, vehicle, client, agency) => {
    return new Promise((resolve, reject) => {
      try {
        const docsDir = path.join(__dirname, '../documents');
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }

        const pdfPath = path.join(docsDir, `Contrat_${contract.contractNumber}.pdf`);
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('AfriRide - Plateforme de Location de Vehicules', { align: 'center' });
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(11).font('Helvetica-Bold').text(`Numero de Contrat: ${contract.contractNumber}`, 50);
        doc.fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 50);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('1. PARTIES AU CONTRAT', 50);
        doc.fontSize(10).font('Helvetica').text(
          `LOCATEUR: ${agency.name}\n` +
          `Adresse: ${agency.address || 'Non specifiee'}\n` +
          `Telephone: ${agency.phone || 'Non specifie'}\n\n` +
          `LOCATAIRE: ${client.firstName} ${client.lastName}\n` +
          `Email: ${client.email}\n` +
          `Telephone: ${client.phone}`,
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('2. VEHICULE LOUE', 50);
        doc.fontSize(10).font('Helvetica').text(
          `Marque et Modele: ${vehicle.brand} ${vehicle.model}\n` +
          `Plaque d'immatriculation: ${vehicle.licensePlate}\n` +
          `Type de carburant: ${vehicle.fuelType}\n` +
          `Couleur: ${vehicle.color || 'Non specifiee'}\n` +
          `Annee: ${vehicle.year || 'Non specifiee'}`,
          50, { width: 450 }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('3. DATES ET DUREE DE LOCATION', 50);
        const startDate = new Date(contract.startDate).toLocaleDateString('fr-FR');
        const endDate = new Date(contract.endDate).toLocaleDateString('fr-FR');
        let days = Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24));
        if (days < 1 || Number.isNaN(days)) days = 1;
        doc.fontSize(10).font('Helvetica').text(
          `Date de debut: ${startDate}\n` +
          `Date de fin: ${endDate}\n` +
          `Duree: ${days} jour(s)`,
          50, { width: 450 }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('4. TARIFICATION', 50);
        const totalAmount = contract.totalAmount || 0;
        const pricePerDay = days > 0 ? totalAmount / days : totalAmount;
        const validPricePerDay = Number.isNaN(pricePerDay) ? 0 : pricePerDay;
        const validTotal = Number.isNaN(totalAmount) ? 0 : totalAmount;
        doc.fontSize(10).font('Helvetica').text(
          `Prix par jour: ${validPricePerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}\n` +
          `Nombre de jours: ${days}\n` +
          `Montant total: ${validTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`,
          50, { width: 450 }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('5. CONDITIONS DE PAIEMENT', 50);
        doc.fontSize(9).font('Helvetica').text(
          contract.paymentTerms || 'Le montant total doit etre paye avant la recuperation du vehicule.',
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('6. CONDITIONS GENERALES', 50);
        doc.fontSize(9).font('Helvetica').text(
          contract.terms || 'Conditions standard de location. Le locataire accepte les conditions de la plateforme AfriRide.',
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('7. RESPONSABILITES DU LOCATAIRE', 50);
        doc.fontSize(9).font('Helvetica').text(
          '- Utiliser le vehicule conformement aux lois en vigueur\n' +
          '- Maintenir le vehicule en bon etat\n' +
          '- Effectuer les petits entretiens (carburant, eau)\n' +
          '- Retourner le vehicule a temps\n' +
          '- Signaler tout dommage immediatement\n' +
          '- Fournir une assurance automobile valide',
          50, { width: 450 }
        );
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('8. SIGNATURES', 50);
        doc.moveDown(1);

        const signBoxY = doc.y;
        const signBoxWidth = 180;
        const signBoxHeight = 60;

        doc.rect(50, signBoxY, signBoxWidth, signBoxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').text('Signature Locataire', 55, signBoxY + 5);
        if (contract.clientSignatureDate) {
          doc.fontSize(8).font('Helvetica').text(
            `Signe le: ${new Date(contract.clientSignatureDate).toLocaleDateString('fr-FR')}`,
            55, signBoxY + 35
          );
        }

        doc.rect(320, signBoxY, signBoxWidth, signBoxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').text('Signature Locateur', 325, signBoxY + 5);
        if (contract.agencySignatureDate) {
          doc.fontSize(8).font('Helvetica').text(
            `Signe le: ${new Date(contract.agencySignatureDate).toLocaleDateString('fr-FR')}`,
            325, signBoxY + 35
          );
        }

        doc.moveDown(5);
        doc.fontSize(8).font('Helvetica').text(
          'Ce contrat a ete genere electroniquement par la plateforme AfriRide. Les signatures numeriques sont legalement valables.',
          50, doc.y, { width: 450, align: 'center', color: '#666' }
        );

        doc.end();

        stream.on('finish', () => resolve(pdfPath));
        stream.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  },

  generatePaymentReceiptPDF: async (payment, booking, vehicle, agency, user) => {
    return new Promise((resolve, reject) => {
      try {
        const docsDir = path.join(__dirname, '../documents');
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }

        const pdfPath = path.join(docsDir, `Recu_${payment.id}.pdf`);
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        renderPaymentReceipt(doc, { payment, booking, vehicle, agency, user });
        doc.end();

        stream.on('finish', () => resolve(pdfPath));
        stream.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  },

  generatePaymentReceiptBuffer: async (payment, booking, vehicle, agency, user) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        renderPaymentReceipt(doc, { payment, booking, vehicle, agency, user });
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = pdfService;
