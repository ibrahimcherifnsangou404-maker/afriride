const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Dessine un bloc de signature sur le document PDF.
 * @param {PDFDocument} doc - L'instance du document PDF.
 * @param {number} x - La position X du bloc.
 * @param {number} y - La position Y du bloc.
 * @param {string} title - Le titre du signataire (ex: 'Le Locataire').
 * @param {string} subtitle - Le sous-titre (ex: 'Lu et approuvé').
 * @param {Date | string | null} signatureDate - La date de signature.
 */
const drawSignatureBlock = (doc, x, y, title, subtitle, signatureDate) => {
    doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text(title, x, y);
    doc.fontSize(8).font('Helvetica').text(subtitle, x, y + 15);
    if (signatureDate) {
        doc.fontSize(10).fillColor('green').text(`Signé numériquement le\n${new Date(signatureDate).toLocaleString('fr-FR')}`, x, y + 30);
    } else {
        doc.fontSize(10).fillColor('grey').text('(En attente de signature)', x, y + 30);
    }
};

/**
 * Génère un PDF pour un contrat de location
 * @param {Object} contract - Les données du contrat
 * @param {Object} vehicle - Les données du véhicule
 * @param {Object} user - Les données du client
 * @param {Object} agency - Les données de l'agence
 * @returns {Promise<string>} - Le chemin du fichier PDF généré
 */
const generateContractPDF = (contract, vehicle, user, agency) => {
    return new Promise((resolve, reject) => {
        try {
            // 1. Configuration du document
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `Contrat_${contract.contractNumber}.pdf`;
            
            // Assurer que le dossier documents existe
            const documentsDir = path.join(__dirname, '../documents');
            if (!fs.existsSync(documentsDir)){
                fs.mkdirSync(documentsDir, { recursive: true });
            }

            const filePath = path.join(documentsDir, fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // 2. En-tête
            doc.fontSize(20).text('AFRIRIDE', { align: 'center', underline: true });
            doc.fontSize(10).text('Plateforme de Location de Véhicules', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(16).text('CONTRAT DE LOCATION', { align: 'center' });
            doc.moveDown();

            // Info Contrat (Cadre droit)
            doc.fontSize(10).text(`Réf: ${contract.contractNumber}`, { align: 'right' });
            doc.text(`Date d'émission: ${new Date(contract.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
            doc.moveDown();

            // 3. Les Parties
            doc.fontSize(12).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :', { underline: true });
            doc.moveDown(0.5);

            // Agence
            doc.font('Helvetica-Bold').text('LE LOUEUR (L\'Agence) :');
            doc.font('Helvetica').text(`Nom : ${agency.name || 'Agence Partenaire'}`);
            doc.text(`Email : ${agency.email}`);
            doc.moveDown(0.5);

            // Client
            doc.font('Helvetica-Bold').text('ET LE LOCATAIRE (Le Client) :');
            doc.font('Helvetica').text(`Nom : ${user.firstName} ${user.lastName}`);
            doc.text(`Email : ${user.email}`);
            doc.text(`Téléphone : ${user.phone || 'Non renseigné'}`);
            doc.moveDown();

            // 4. Le Véhicule
            doc.fontSize(12).font('Helvetica-Bold').text('OBJET DU CONTRAT (Le Véhicule) :', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica').text(`Marque / Modèle : ${vehicle.brand} ${vehicle.model}`);
            doc.text(`Immatriculation : ${vehicle.licensePlate || 'En cours'}`);
            doc.text(`Année : ${vehicle.year}`);
            doc.moveDown();

            // 5. Détails de la Location
            doc.fontSize(12).font('Helvetica-Bold').text('DÉTAILS DE LA LOCATION :', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica').text(`Date de début : ${new Date(contract.startDate).toLocaleDateString('fr-FR')}`);
            doc.text(`Date de fin : ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`);
            doc.text(`Montant Total réglé : ${contract.totalAmount} FCFA`);
            doc.moveDown();

            // 6. Conditions (Version courte)
            doc.fontSize(12).font('Helvetica-Bold').text('CONDITIONS GÉNÉRALES :', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica').text(contract.terms || "Le locataire s'engage à restituer le véhicule dans le même état qu'à la prise en charge. Tout dommage sera facturé. Le véhicule est assuré selon les conditions de l'agence.", {
                align: 'justify'
            });
            doc.moveDown(2);

            // 7. Signatures
            doc.fontSize(12).font('Helvetica-Bold').text('SIGNATURES :', { underline: true });
            doc.moveDown();

            const signatureY = doc.y;

            // Zone Client
            drawSignatureBlock(doc, 50, signatureY, 'Le Locataire', 'Lu et approuvé', contract.clientSignatureDate);

            // Zone Agence
            drawSignatureBlock(doc, 350, signatureY, 'Le Loueur', 'Pour accord', contract.agencySignatureDate);

            // Finalisation
            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateContractPDF };
