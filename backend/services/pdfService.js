const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfService = {
  /**
   * Générer PDF du contrat
   */
  generateContractPDF: async (contract, vehicle, client, agency) => {
    return new Promise((resolve, reject) => {
      try {
        // Créer le dossier documents s'il n'existe pas
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

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('AfriRide - Plateforme de Location de Véhicules', { align: 'center' });
        doc.moveDown();

        // Ligne séparatrice
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Numéro et date du contrat
        doc.fontSize(11).font('Helvetica-Bold').text(`Numéro de Contrat: ${contract.contractNumber}`, 50);
        doc.fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 50);
        doc.moveDown();

        // Section: Parties au contrat
        doc.fontSize(12).font('Helvetica-Bold').text('1. PARTIES AU CONTRAT', 50);
        doc.fontSize(10).font('Helvetica').text(
          `LOCATEUR: ${agency.name}\n` +
          `Adresse: ${agency.address || 'Non spécifiée'}\n` +
          `Téléphone: ${agency.phone || 'Non spécifié'}\n\n` +
          `LOCATAIRE: ${client.firstName} ${client.lastName}\n` +
          `Email: ${client.email}\n` +
          `Téléphone: ${client.phone}`,
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        // Section: Véhicule
        doc.fontSize(12).font('Helvetica-Bold').text('2. VÉHICULE LOUÉ', 50);
        doc.fontSize(10).font('Helvetica').text(
          `Marque et Modèle: ${vehicle.brand} ${vehicle.model}\n` +
          `Plaque d'immatriculation: ${vehicle.licensePlate}\n` +
          `Type de carburant: ${vehicle.fuelType}\n` +
          `Couleur: ${vehicle.color || 'Non spécifiée'}\n` +
          `Année: ${vehicle.year || 'Non spécifiée'}`,
          50, { width: 450 }
        );
        doc.moveDown();

        // Section: Dates et durée
        doc.fontSize(12).font('Helvetica-Bold').text('3. DATES ET DURÉE DE LOCATION', 50);
        const startDate = new Date(contract.startDate).toLocaleDateString('fr-FR');
        const endDate = new Date(contract.endDate).toLocaleDateString('fr-FR');
        let days = Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24));
        
        // Protection contre les valeurs invalides
        if (days < 1 || isNaN(days)) {
          days = 1; // Au minimum 1 jour
        }
        
        doc.fontSize(10).font('Helvetica').text(
          `Date de début: ${startDate}\n` +
          `Date de fin: ${endDate}\n` +
          `Durée: ${days} jour(s)`,
          50, { width: 450 }
        );
        doc.moveDown();

        // Section: Tarification
        doc.fontSize(12).font('Helvetica-Bold').text('4. TARIFICATION', 50);
        const totalAmount = contract.totalAmount || 0;
        const pricePerDay = days > 0 ? totalAmount / days : totalAmount;
        
        // Vérifier que les valeurs sont valides
        const validPricePerDay = isNaN(pricePerDay) ? 0 : pricePerDay;
        const validTotal = isNaN(totalAmount) ? 0 : totalAmount;
        
        doc.fontSize(10).font('Helvetica').text(
          `Prix par jour: ${validPricePerDay.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}\n` +
          `Nombre de jours: ${days}\n` +
          `Montant total: ${validTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`,
          50, { width: 450 }
        );
        doc.moveDown();

        // Section: Conditions de paiement
        doc.fontSize(12).font('Helvetica-Bold').text('5. CONDITIONS DE PAIEMENT', 50);
        doc.fontSize(9).font('Helvetica').text(
          contract.paymentTerms || 'Le montant total doit être payé avant la récupération du véhicule.',
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        // Section: Conditions générales
        doc.fontSize(12).font('Helvetica-Bold').text('6. CONDITIONS GÉNÉRALES', 50);
        doc.fontSize(9).font('Helvetica').text(
          contract.terms || 'Conditions standard de location. Le locataire accepte les conditions de la plateforme AfriRide.',
          50, { width: 450, align: 'left' }
        );
        doc.moveDown();

        // Section: Responsabilités
        doc.fontSize(12).font('Helvetica-Bold').text('7. RESPONSABILITÉS DU LOCATAIRE', 50);
        doc.fontSize(9).font('Helvetica').text(
          '• Utiliser le véhicule conformément aux lois en vigueur\n' +
          '• Maintenir le véhicule en bon état\n' +
          '• Effectuer les petits entretiens (carburant, eau)\n' +
          '• Retourner le véhicule à temps\n' +
          '• Signaler tout dommage immédiatement\n' +
          '• Fournir une assurance automobile valide',
          50, { width: 450 }
        );
        doc.moveDown();

        // Ligne séparatrice avant signatures
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Section: Signatures
        doc.fontSize(12).font('Helvetica-Bold').text('8. SIGNATURES', 50);
        doc.moveDown(1);

        // Signatures boxes
        const signBoxY = doc.y;
        const signBoxWidth = 180;
        const signBoxHeight = 60;

        // Client signature
        doc.rect(50, signBoxY, signBoxWidth, signBoxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').text('Signature Locataire', 55, signBoxY + 5);
        if (contract.clientSignatureDate) {
          doc.fontSize(8).font('Helvetica').text(
            `Signé le: ${new Date(contract.clientSignatureDate).toLocaleDateString('fr-FR')}`,
            55, signBoxY + 35
          );
        }

        // Agency signature
        doc.rect(320, signBoxY, signBoxWidth, signBoxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').text('Signature Locateur', 325, signBoxY + 5);
        if (contract.agencySignatureDate) {
          doc.fontSize(8).font('Helvetica').text(
            `Signé le: ${new Date(contract.agencySignatureDate).toLocaleDateString('fr-FR')}`,
            325, signBoxY + 35
          );
        }

        doc.moveDown(5);

        // Footer
        doc.fontSize(8).font('Helvetica').text(
          'Ce contrat a été généré électroniquement par la plateforme AfriRide. ' +
          'Les signatures numériques sont légalement valables.',
          50, doc.y, { width: 450, align: 'center', color: '#666' }
        );

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          console.log('✅ PDF généré:', pdfPath);
          resolve(pdfPath);
        });

        stream.on('error', (error) => {
          console.error('❌ Erreur création PDF:', error.message);
          reject(error);
        });
      } catch (error) {
        console.error('❌ Erreur dans generateContractPDF:', error.message);
        reject(error);
      }
    });
  },

  /**
   * Générer reçu de paiement PDF
   */
  generatePaymentReceiptPDF: async (payment, booking, user) => {
    return new Promise((resolve, reject) => {
      try {
        const docsDir = path.join(__dirname, '../documents');
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }

        const pdfPath = path.join(docsDir, `Recu_${payment.id}.pdf`);
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('REÇU DE PAIEMENT', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('AfriRide - Plateforme de Location de Véhicules', { align: 'center' });
        doc.moveDown();

        // Infos paiement
        doc.fontSize(11).font('Helvetica-Bold').text('Numéro de reçu:', 50);
        doc.fontSize(10).font('Helvetica').text(payment.id, 150);
        doc.fontSize(11).font('Helvetica-Bold').text('Date:', 50);
        doc.fontSize(10).font('Helvetica').text(new Date(payment.createdAt).toLocaleDateString('fr-FR'), 150);
        doc.moveDown();

        // Client
        doc.fontSize(11).font('Helvetica-Bold').text('Client:', 50);
        doc.fontSize(10).font('Helvetica').text(`${user.firstName} ${user.lastName}`, 150);
        doc.fontSize(10).text(user.email, 150);
        doc.moveDown();

        // Détails
        doc.fontSize(12).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT');
        doc.fontSize(10).font('Helvetica').text(`Référence réservation: ${booking.id.substring(0, 8).toUpperCase()}`);
        doc.fontSize(10).text(`Montant: ${payment.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`);
        doc.fontSize(10).text(`Statut: ${payment.status.toUpperCase()}`);
        doc.fontSize(10).text(`Méthode: ${payment.paymentMethod || 'Non spécifiée'}`);
        doc.moveDown();

        // Footer
        doc.fontSize(8).text('Merci pour votre achat!', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          console.log('✅ Reçu PDF généré:', pdfPath);
          resolve(pdfPath);
        });

        stream.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = pdfService;
