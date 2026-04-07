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

const compactLine = (value, fallback = '-') => {
  if (!value && value !== 0) return fallback;
  return String(value).replace(/\s+/g, ' ').trim() || fallback;
};

const compactParagraph = (value, fallback, maxChars) => {
  const cleanText = compactLine(value, fallback);
  if (cleanText.length <= maxChars) return cleanText;
  return `${cleanText.slice(0, maxChars - 1).trim()}...`;
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
          margin: 34,
          size: 'A4'
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        const startDate = new Date(contract.startDate).toLocaleDateString('fr-FR');
        const endDate = new Date(contract.endDate).toLocaleDateString('fr-FR');
        let days = Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24));
        if (days < 1 || Number.isNaN(days)) days = 1;
        const totalAmount = contract.totalAmount || 0;
        const pricePerDay = days > 0 ? totalAmount / days : totalAmount;
        const validPricePerDay = Number.isNaN(pricePerDay) ? 0 : pricePerDay;
        const validTotal = Number.isNaN(totalAmount) ? 0 : totalAmount;

        const margin = 34;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - (margin * 2);
        const columnGap = 14;
        const columnWidth = (contentWidth - columnGap) / 2;

        const clientName = compactLine(`${client.firstName || ''} ${client.lastName || ''}`, '-');
        const agencyName = compactLine(agency.name, '-');
        const vehicleLabel = compactLine(`${vehicle.brand || ''} ${vehicle.model || ''}`, '-');
        const paymentTerms = compactParagraph(
          contract.paymentTerms,
          'Paiement integral avant remise du vehicule.',
          120
        );
        const generalTerms = compactParagraph(
          contract.terms,
          'Location soumise aux conditions AfriRide et au respect du code de la route.',
          240
        );

        doc.font('Helvetica-Bold').fontSize(17).fillColor('#0f172a')
          .text('CONTRAT DE LOCATION', margin, 30, { width: contentWidth, align: 'center' });
        doc.font('Helvetica').fontSize(8.5).fillColor('#475569')
          .text('AfriRide - Contrat simplifie', margin, 50, { width: contentWidth, align: 'center' });

        doc.lineWidth(0.9).strokeColor('#cbd5e1')
          .moveTo(margin, 66).lineTo(pageWidth - margin, 66).stroke();

        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a')
          .text(`No ${compactLine(contract.contractNumber, '-')}`, margin, 76);
        doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
          .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 120, 76, { width: 120, align: 'right' });

        const blockTop = 98;
        const blockHeight = 102;
        const leftX = margin;
        const rightX = margin + columnWidth + columnGap;

        doc.lineWidth(0.8).strokeColor('#dbe4ee').rect(leftX, blockTop, columnWidth, blockHeight).stroke();
        doc.lineWidth(0.8).strokeColor('#dbe4ee').rect(rightX, blockTop, columnWidth, blockHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('PARTIES', leftX + 8, blockTop + 8);
        doc.font('Helvetica').fontSize(8).fillColor('#334155')
          .text(
            `Locateur: ${agencyName}\nAdresse: ${compactParagraph(agency.address, 'Non specifiee', 62)}\nTel: ${compactLine(agency.phone, 'Non specifie')}\n\nLocataire: ${clientName}\nEmail: ${compactParagraph(client.email, '-', 36)}\nTel: ${compactLine(client.phone, 'Non specifie')}`,
            leftX + 8,
            blockTop + 24,
            { width: columnWidth - 16, lineGap: 1.5 }
          );

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('VEHICULE & DUREE', rightX + 8, blockTop + 8);
        doc.font('Helvetica').fontSize(8).fillColor('#334155')
          .text(
            `Modele: ${vehicleLabel}\nImmatriculation: ${compactLine(vehicle.licensePlate, '-')}\nCarburant: ${compactLine(vehicle.fuelType, '-')}\nAnnee: ${compactLine(vehicle.year, '-')}\n\nDu ${startDate} au ${endDate}\nDuree: ${days} jour(s)`,
            rightX + 8,
            blockTop + 24,
            { width: columnWidth - 16, lineGap: 1.5 }
          );

        const pricingTop = blockTop + blockHeight + 12;
        const pricingHeight = 56;
        doc.lineWidth(0.8).strokeColor('#dbe4ee').rect(margin, pricingTop, contentWidth, pricingHeight).stroke();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('TARIFICATION', margin + 8, pricingTop + 8);
        doc.font('Helvetica').fontSize(8.2).fillColor('#334155').text(
          `Prix/jour: ${validPricePerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}   |   Nombre de jours: ${days}   |   Montant total: ${validTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`,
          margin + 8,
          pricingTop + 26,
          { width: contentWidth - 16 }
        );

        const termsTop = pricingTop + pricingHeight + 10;
        const termsHeight = 158;
        doc.lineWidth(0.8).strokeColor('#dbe4ee').rect(margin, termsTop, contentWidth, termsHeight).stroke();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('CONDITIONS', margin + 8, termsTop + 8);
        doc.font('Helvetica').fontSize(8).fillColor('#334155')
          .text(`Paiement: ${paymentTerms}`, margin + 8, termsTop + 24, { width: contentWidth - 16 });
        doc.text(`Conditions generales: ${generalTerms}`, margin + 8, termsTop + 46, { width: contentWidth - 16, lineGap: 1.2 });
        doc.text(
          'Responsabilites locataire: utilisation legale, entretien courant, retour a l heure, signalement immediat des dommages, assurance valide.',
          margin + 8,
          termsTop + 86,
          { width: contentWidth - 16, lineGap: 1.2 }
        );

        const signaturesTop = termsTop + termsHeight + 10;
        const signBoxWidth = (contentWidth - columnGap) / 2;
        const signBoxHeight = 62;
        doc.lineWidth(0.8).strokeColor('#cbd5e1').rect(margin, signaturesTop, signBoxWidth, signBoxHeight).stroke();
        doc.lineWidth(0.8).strokeColor('#cbd5e1').rect(margin + signBoxWidth + columnGap, signaturesTop, signBoxWidth, signBoxHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text('Signature Locataire', margin + 8, signaturesTop + 8);
        doc.font('Helvetica').fontSize(7.8).fillColor('#475569').text(
          contract.clientSignatureDate ? `Signe le: ${new Date(contract.clientSignatureDate).toLocaleDateString('fr-FR')}` : 'Non signe',
          margin + 8,
          signaturesTop + 42
        );

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text('Signature Locateur', margin + signBoxWidth + columnGap + 8, signaturesTop + 8);
        doc.font('Helvetica').fontSize(7.8).fillColor('#475569').text(
          contract.agencySignatureDate ? `Signe le: ${new Date(contract.agencySignatureDate).toLocaleDateString('fr-FR')}` : 'Non signe',
          margin + signBoxWidth + columnGap + 8,
          signaturesTop + 42
        );

        const footerY = Math.min(pageHeight - 34, signaturesTop + signBoxHeight + 10);
        doc.font('Helvetica').fontSize(7.2).fillColor('#64748b')
          .text(
            'Document genere electroniquement par AfriRide. Ce format compact est valide au meme titre que la version detaillee.',
            margin,
            footerY,
            { width: contentWidth, align: 'center' }
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
