const { Booking, User, Vehicle, Agency } = require('../models');

/**
 * Service de génération de contrats dynamiques
 * Récupère les informations du client et de la réservation
 * Génère le contenu du contrat en HTML/texte
 */
class ContractGeneratorService {
  /**
   * Générer le contenu d'un contrat avec les informations réelles
   * @param {UUID} bookingId - ID de la réservation
   * @returns {Promise<Object>} Contrat généré avec les informations
   */
  async generateContractContent(bookingId) {
    try {
      // Récupérer la réservation avec toutes les relations
      const booking = await Booking.findByPk(bookingId, {
        include: [
          { model: User, as: 'user' },
          { model: Vehicle, as: 'vehicle', include: [{ model: Agency, as: 'agency' }] }
        ]
      });

      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      const { user, vehicle, startDate, endDate, totalPrice, finalPrice } = booking;
      const agency = vehicle.agency;

      // Calculer le nombre de jours
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      // Formater les dates
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      const today = this.formatDate(new Date());

      // Générer le numéro de contrat unique
      const contractNumber = this.generateContractNumber();

      // Générer le contenu HTML du contrat
      const contractContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat de Location - ${contractNumber}</title>
    <style>
        * { margin: 0; padding: 0; }
        body {
            font-family: 'Arial', sans-serif;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2d7d4c;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2d7d4c;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .contract-number {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            background-color: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            font-size: 16px;
            color: #2d7d4c;
            margin-bottom: 15px;
            border-left: 4px solid #2d7d4c;
        }
        .info-block {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 3px solid #2d7d4c;
        }
        .info-label {
            font-weight: bold;
            color: #2d7d4c;
            font-size: 14px;
        }
        .info-value {
            color: #333;
            font-size: 14px;
            margin-top: 5px;
        }
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .terms {
            background-color: #fff9e6;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #f0e6c8;
            margin-bottom: 20px;
        }
        .terms h3 {
            color: #2d7d4c;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .terms ul {
            list-style-position: inside;
            margin-left: 10px;
        }
        .terms li {
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .summary {
            background-color: #e6f5f0;
            padding: 20px;
            border-radius: 5px;
            border: 2px solid #2d7d4c;
            margin-bottom: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .summary-row.total {
            font-weight: bold;
            font-size: 16px;
            color: #2d7d4c;
            border-top: 2px solid #2d7d4c;
            padding-top: 10px;
        }
        .signature-area {
            margin-top: 40px;
            border-top: 2px solid #ddd;
            padding-top: 20px;
        }
        .signature-block {
            float: left;
            width: 45%;
            text-align: center;
            margin-top: 30px;
        }
        .signature-line {
            border-bottom: 2px solid #333;
            width: 100%;
            height: 50px;
            margin-bottom: 10px;
        }
        .footer {
            clear: both;
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .warning {
            background-color: #fef5f5;
            border-left: 4px solid #d32f2f;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .warning strong {
            color: #d32f2f;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- EN-TÊTE -->
        <div class="header">
            <div class="contract-number">Numéro de contrat: <strong>${contractNumber}</strong></div>
            <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>
            <p style="color: #666; font-size: 14px;">Date du contrat: ${today}</p>
        </div>

        <!-- SECTION: AGENCE -->
        <div class="section">
            <div class="section-title">AGENCE DE LOCATION</div>
            <div class="info-block">
                <div class="info-label">${agency.name}</div>
                <div class="info-value">
                    Adresse: ${agency.address}<br>
                    Téléphone: ${agency.phone}<br>
                    ${agency.email ? `Email: ${agency.email}<br>` : ''}
                </div>
            </div>
        </div>

        <!-- SECTION: DONNÉES CLIENT -->
        <div class="section">
            <div class="section-title">INFORMATIONS DU CLIENT</div>
            <div class="two-columns">
                <div class="info-block">
                    <div class="info-label">Nom complet</div>
                    <div class="info-value">${user.firstName} ${user.lastName}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Email</div>
                    <div class="info-value">${user.email}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Téléphone</div>
                    <div class="info-value">${user.phone || 'Non fourni'}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Adresse</div>
                    <div class="info-value">${user.address || 'Non fournie'}</div>
                </div>
            </div>
        </div>

        <!-- SECTION: VÉHICULE -->
        <div class="section">
            <div class="section-title">VÉHICULE LOUÉ</div>
            <div class="two-columns">
                <div class="info-block">
                    <div class="info-label">Marque et Modèle</div>
                    <div class="info-value">${vehicle.brand} ${vehicle.model}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Année</div>
                    <div class="info-value">${vehicle.year}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Immatriculation</div>
                    <div class="info-value">${vehicle.licensePlate || 'N/A'}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Carburant</div>
                    <div class="info-value">${this.formatFuelType(vehicle.fuelType)}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Transmission</div>
                    <div class="info-value">${vehicle.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Nombre de places</div>
                    <div class="info-value">${vehicle.seats}</div>
                </div>
            </div>
        </div>

        <!-- SECTION: DATES ET DURÉE -->
        <div class="section">
            <div class="section-title">PÉRIODE DE LOCATION</div>
            <div class="two-columns">
                <div class="info-block">
                    <div class="info-label">Date de début</div>
                    <div class="info-value">${formattedStartDate}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Date de fin</div>
                    <div class="info-value">${formattedEndDate}</div>
                </div>
            </div>
            <div class="info-block">
                <div class="info-label">Durée totale</div>
                <div class="info-value">${totalDays} jour(s)</div>
            </div>
        </div>

        <!-- SECTION: TARIFICATION -->
        <div class="section">
            <div class="section-title">TARIFICATION ET PAIEMENT</div>
            <div class="summary">
                <div class="summary-row">
                    <span>Prix par jour:</span>
                    <span>${parseFloat(vehicle.pricePerDay).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div class="summary-row">
                    <span>Nombre de jours:</span>
                    <span>${totalDays}</span>
                </div>
                <div class="summary-row">
                    <span>Sous-total:</span>
                    <span>${parseFloat(totalPrice).toLocaleString('fr-FR')} FCFA</span>
                </div>
                ${finalPrice && finalPrice !== totalPrice ? `
                <div class="summary-row">
                    <span>Réduction appliquée:</span>
                    <span>-${(parseFloat(totalPrice) - parseFloat(finalPrice)).toLocaleString('fr-FR')} FCFA</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>MONTANT TOTAL À PAYER:</span>
                    <span>${parseFloat(finalPrice || totalPrice).toLocaleString('fr-FR')} FCFA</span>
                </div>
            </div>
        </div>

        <!-- AVERTISSEMENT -->
        <div class="warning">
            <strong>⚠️ IMPORTANT:</strong> Le client déclare avoir pris connaissance de l'état du véhicule et accepte de le restituer en bon état. Tout dommage supplémentaire sera facturé au client.
        </div>

        <!-- CONDITIONS GÉNÉRALES -->
        <div class="section">
            <div class="section-title">CONDITIONS GÉNÉRALES DE LOCATION</div>
            
            <div class="terms">
                <h3>1. Objet du contrat</h3>
                <ul>
                    <li>Le loueur met à disposition du client un véhicule pour une durée limitée</li>
                    <li>Le client s'engage à utiliser le véhicule selon les règles du code de la route</li>
                    <li>La location est consentie pour le seul usage personnel du client</li>
                </ul>
            </div>

            <div class="terms">
                <h3>2. État du véhicule</h3>
                <ul>
                    <li>Le client reconnaît avoir reçu le véhicule en bon état et de fonctionnement</li>
                    <li>Tout dommage apparent doit être signalé immédiatement à l'agence</li>
                    <li>L'absence de reclamation implique l'acceptation de l'état du véhicule</li>
                </ul>
            </div>

            <div class="terms">
                <h3>3. Responsabilités du client</h3>
                <ul>
                    <li>Le client est responsable de tous les dommages causés au véhicule</li>
                    <li>Le client doit conduire prudemment et respecter le code de la route</li>
                    <li>Le client ne doit pas sous-louer ou prêter le véhicule à un tiers</li>
                    <li>Le client doit maintenir le niveau de carburant et d'huile moteur</li>
                </ul>
            </div>

            <div class="terms">
                <h3>4. Carburant et consommables</h3>
                <ul>
                    <li>Le véhicule est fourni avec un plein de carburant</li>
                    <li>La restitution doit se faire avec le même niveau de carburant</li>
                    <li>Tout manque sera facturé au tarif en vigueur</li>
                </ul>
            </div>

            <div class="terms">
                <h3>5. Sinistres et assurance</h3>
                <ul>
                    <li>Le véhicule est assuré contre les tiers</li>
                    <li>En cas d'accident, le client doit immédiatement notifier l'agence</li>
                    <li>Le client est responsable de la franchise selon les conditions d'assurance</li>
                </ul>
            </div>

            <div class="terms">
                <h3>6. Paiement</h3>
                <ul>
                    <li>Le montant total est payable avant la prise de possession du véhicule</li>
                    <li>Le paiement se fait par les moyens proposés par l'agence</li>
                    <li>Aucun remboursement en cas d'annulation après la signature</li>
                </ul>
            </div>

            <div class="terms">
                <h3>7. Restitution du véhicule</h3>
                <ul>
                    <li>Le véhicule doit être restitué à la date et l'heure convenues</li>
                    <li>Tout retard sera facturé à raison d'une demi-journée minimum</li>
                    <li>Le véhicule doit être restitué propre et en bon état</li>
                </ul>
            </div>

            <div class="terms">
                <h3>8. Annulation</h3>
                <ul>
                    <li>Annulation gratuite jusqu'à 24 heures avant la date de location</li>
                    <li>Au-delà, une pénalité sera appliquée</li>
                </ul>
            </div>

            <div class="terms">
                <h3>9. Limitation de responsabilité</h3>
                <ul>
                    <li>L'agence n'est pas responsable des objets oubliés dans le véhicule</li>
                    <li>L'agence n'est pas responsable des dommages causés par force majeure</li>
                </ul>
            </div>
        </div>

        <!-- SIGNATURE -->
        <div class="signature-area">
            <h3 style="margin-bottom: 20px; text-align: center; color: #2d7d4c;">SIGNATURES</h3>
            
            <div class="signature-block">
                <p style="margin-bottom: 30px;"><strong>CLIENT</strong></p>
                <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Signature:</p>
                <div class="signature-line"></div>
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
                    ${user.firstName} ${user.lastName}<br>
                    ${new Date().toLocaleDateString('fr-FR')}
                </p>
            </div>

            <div class="signature-block" style="float: right;">
                <p style="margin-bottom: 30px;"><strong>AGENCE</strong></p>
                <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Signature:</p>
                <div class="signature-line"></div>
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
                    ${agency.name}<br>
                    ${new Date().toLocaleDateString('fr-FR')}
                </p>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p>Ce contrat a été généré le ${today} par le système AfriRide.</p>
            <p>Pour toute question, veuillez contacter ${agency.name} au ${agency.phone}</p>
        </div>
    </div>
</body>
</html>
      `;

      return {
        contractNumber,
        content: contractContent,
        bookingId,
        clientName: `${user.firstName} ${user.lastName}`,
        vehicleInfo: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        totalAmount: parseFloat(finalPrice || totalPrice),
        agencyName: agency.name
      };
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
      throw error;
    }
  }

  /**
   * Formater une date en français
   */
  formatDate(date) {
    const d = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options)
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Générer un numéro de contrat unique
   */
  generateContractNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `CNT-${year}${month}${day}-${random}`;
  }

  /**
   * Formater le type de carburant
   */
  formatFuelType(fuelType) {
    const fuelTypes = {
      'petrol': 'Essence',
      'diesel': 'Diesel',
      'electric': 'Électrique',
      'hybrid': 'Hybride'
    };
    return fuelTypes[fuelType] || fuelType;
  }
}

module.exports = new ContractGeneratorService();
