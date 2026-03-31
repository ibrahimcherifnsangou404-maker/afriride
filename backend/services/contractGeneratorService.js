const { Booking, User, Vehicle, Agency } = require('../models');

/**
 * Service de generation de contrats dynamiques.
 * Il centralise les clauses par defaut pour eviter des contrats trop vagues.
 */
class ContractGeneratorService {
  async generateContractContent(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId, {
        include: [
          { model: User, as: 'user' },
          { model: Vehicle, as: 'vehicle', include: [{ model: Agency, as: 'agency' }] }
        ]
      });

      if (!booking) {
        throw new Error('Reservation non trouvee');
      }

      const { user, vehicle, startDate, endDate, totalPrice, finalPrice } = booking;
      const agency = vehicle.agency;
      const totalDays = this.getTotalDays(startDate, endDate);
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      const today = this.formatDate(new Date());
      const contractNumber = this.generateContractNumber();
      const finalAmount = Number(finalPrice || totalPrice || 0);
      const pricingBreakdown = this.getPricingBreakdown({ booking, totalDays });
      const termsText = this.getRentalTerms({ booking, user, vehicle, agency });
      const paymentTermsText = this.getPaymentTerms({ booking, totalDays, pricingBreakdown });
      const notesText = this.getContractNotes({ booking, vehicle, agency });

      const contractContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de location - ${this.escapeHtml(contractNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #eef4ef;
      color: #1f2937;
      padding: 24px;
    }
    .page {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
    }
    .hero {
      padding: 36px 42px;
      background: linear-gradient(135deg, #0f172a, #14532d);
      color: #fff;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: 30px;
    }
    .hero p {
      margin: 0;
      color: rgba(255,255,255,0.82);
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 24px;
    }
    .meta-card {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 14px;
      padding: 14px;
    }
    .meta-card span {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.72);
      margin-bottom: 6px;
    }
    .meta-card strong {
      font-size: 15px;
    }
    .content {
      padding: 32px 42px 40px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section h2 {
      font-size: 18px;
      margin: 0 0 14px;
      color: #0f172a;
      border-left: 4px solid #15803d;
      padding-left: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .card {
      border: 1px solid #dbe4dd;
      background: #f8fbf8;
      border-radius: 14px;
      padding: 16px;
    }
    .card .label {
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .card .value {
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
    }
    .summary {
      border: 1px solid #cfe6d5;
      background: #eff9f1;
      border-radius: 16px;
      padding: 18px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #dbeadf;
      font-size: 14px;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .summary-row.total {
      font-weight: bold;
      font-size: 17px;
      color: #14532d;
    }
    .notice {
      border-left: 4px solid #dc2626;
      background: #fef2f2;
      color: #7f1d1d;
      padding: 16px;
      border-radius: 12px;
      line-height: 1.6;
    }
    .text-block {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 14px;
      padding: 18px;
      white-space: pre-line;
      line-height: 1.7;
      font-size: 14px;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      margin-top: 22px;
    }
    .signature-box {
      border: 1px dashed #94a3b8;
      border-radius: 14px;
      min-height: 150px;
      padding: 16px;
    }
    .signature-box h3 {
      margin: 0 0 12px;
      font-size: 15px;
    }
    .signature-line {
      height: 55px;
      border-bottom: 1px solid #1f2937;
      margin: 26px 0 10px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
      text-align: center;
      line-height: 1.6;
    }
    @media (max-width: 820px) {
      .meta, .grid, .signatures {
        grid-template-columns: 1fr;
      }
      .hero, .content {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <p>Document contractuel AfriRide</p>
      <h1>Contrat de location de vehicule</h1>
      <p>Reference ${this.escapeHtml(contractNumber)} - etabli le ${this.escapeHtml(today)}</p>

      <div class="meta">
        <div class="meta-card">
          <span>Debut</span>
          <strong>${this.escapeHtml(formattedStartDate)}</strong>
        </div>
        <div class="meta-card">
          <span>Fin</span>
          <strong>${this.escapeHtml(formattedEndDate)}</strong>
        </div>
        <div class="meta-card">
          <span>Duree</span>
          <strong>${totalDays} jour(s)</strong>
        </div>
        <div class="meta-card">
          <span>Montant</span>
          <strong>${this.escapeHtml(this.formatAmount(finalAmount))}</strong>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <h2>Parties au contrat</h2>
        <div class="grid">
          <div class="card">
            <div class="label">Locataire</div>
            <div class="value">${this.escapeHtml(this.getUserIdentityBlock(user))}</div>
          </div>
          <div class="card">
            <div class="label">Loueur</div>
            <div class="value">${this.escapeHtml(this.getAgencyIdentityBlock(agency))}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Vehicule et periode</h2>
        <div class="grid">
          <div class="card">
            <div class="label">Vehicule</div>
            <div class="value">${this.escapeHtml(this.getVehicleIdentityBlock(vehicle))}</div>
          </div>
          <div class="card">
            <div class="label">Mise a disposition</div>
            <div class="value">Du ${this.escapeHtml(formattedStartDate)} au ${this.escapeHtml(formattedEndDate)}
Nombre de jours factures: ${totalDays}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Conditions financieres</h2>
        <div class="summary">
          <div class="summary-row">
            <span>Prix journalier</span>
            <span>${this.escapeHtml(this.formatAmount(pricingBreakdown.pricePerDay))}</span>
          </div>
          <div class="summary-row">
            <span>Nombre de jours</span>
            <span>${totalDays}</span>
          </div>
          <div class="summary-row">
            <span>Sous-total</span>
            <span>${this.escapeHtml(this.formatAmount(pricingBreakdown.subtotal))}</span>
          </div>
          ${pricingBreakdown.discount > 0 ? `
          <div class="summary-row">
            <span>Reduction</span>
            <span>- ${this.escapeHtml(this.formatAmount(pricingBreakdown.discount))}</span>
          </div>
          ` : ''}
          <div class="summary-row total">
            <span>Total a payer</span>
            <span>${this.escapeHtml(this.formatAmount(finalAmount))}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="notice">
          Le locataire reconnait recevoir un vehicule destine a un usage licite et prudent. Toute utilisation contraire au contrat, a la loi, ou aux consignes de l'agence peut entrainer immobilisation, frais supplementaires, resiliation et engagement de responsabilite.
        </div>
      </div>

      <div class="section">
        <h2>Conditions generales de location</h2>
        <div class="text-block">${this.escapeHtml(termsText)}</div>
      </div>

      <div class="section">
        <h2>Conditions de paiement et depot</h2>
        <div class="text-block">${this.escapeHtml(paymentTermsText)}</div>
      </div>

      <div class="section">
        <h2>Mentions operationnelles</h2>
        <div class="text-block">${this.escapeHtml(notesText)}</div>
      </div>

      <div class="section">
        <h2>Signatures</h2>
        <div class="signatures">
          <div class="signature-box">
            <h3>Signature du locataire</h3>
            <div class="signature-line"></div>
            <div>${this.escapeHtml(`${user.firstName} ${user.lastName}`)}</div>
            <div>Date: ${this.escapeHtml(today)}</div>
          </div>
          <div class="signature-box">
            <h3>Signature du loueur</h3>
            <div class="signature-line"></div>
            <div>${this.escapeHtml(agency?.name || 'Agence')}</div>
            <div>Date: ${this.escapeHtml(today)}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        Ce document a ete genere par AfriRide le ${this.escapeHtml(today)}.
        <br>
        Pour toute contestation, les parties s'engagent d'abord a rechercher une resolution amiable avec l'agence avant toute autre demarche.
      </div>
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
        totalAmount: finalAmount,
        agencyName: agency.name,
        terms: termsText,
        paymentTerms: paymentTermsText,
        notes: notesText
      };
    } catch (error) {
      console.error('Erreur lors de la generation du contrat:', error);
      throw error;
    }
  }

  getRentalTerms({ booking, user, vehicle, agency }) {
    const legal = this.getLegalSettings(agency);
    const hasPhone = user?.phone ? `Telephone du locataire: ${user.phone}.` : 'Le locataire s engage a fournir un numero de telephone joignable.';
    const licenseInfo = user?.driverLicenseNumber
      ? `Permis declare: ${user.driverLicenseNumber}.`
      : 'Le locataire certifie etre titulaire d un permis de conduire valide, adapte a la categorie du vehicule, et s engage a le presenter sur demande.';

    return [
      '1. Objet et perimetre',
      `Le present contrat a pour objet la location temporaire du vehicule ${vehicle?.brand || ''} ${vehicle?.model || ''} immatricule ${vehicle?.licensePlate || 'N/A'} par l agence ${agency?.name || 'Agence'} au profit de ${user?.firstName || ''} ${user?.lastName || ''}.`,
      '',
      '2. Conditions de remise et de restitution',
      'Le vehicule est remis dans l etat constate contradictoirement au depart. Le locataire doit restituer le vehicule avec ses accessoires, papiers, cles et equipements de securite, dans un etat conforme a l usage normal, hors usure normale.',
      'Un etat des lieux contradictoire de depart puis de retour complete le present contrat. Les constats, photos, jauges et anomalies releves sur cet etat des lieux font foi entre les parties sauf preuve contraire.',
      'Tout retard de restitution peut entrainer une facturation complementaire, sans prejudice d autres dommages ou frais engages.',
      '',
      '3. Usage autorise et interdictions',
      'Le vehicule ne peut etre utilise que pour un usage licite, prudent et personnel, sauf autorisation expresse ecrite de l agence.',
      'Sont notamment interdits: la sous-location, le transport illicite, la conduite sous l effet d alcool ou de stupefiants, la participation a des courses, l apprentissage de conduite, ainsi que la conduite par une personne non autorisee.',
      '',
      '4. Obligations du locataire',
      'Le locataire doit verifier les niveaux usuels, signaler immediatement toute panne, accident, anomalie ou immobilisation, respecter les alertes du tableau de bord et prendre toutes mesures conservatoires raisonnables.',
      `${hasPhone} ${licenseInfo}`,
      '',
      '5. Responsabilite, sinistre et infractions',
      'Le locataire demeure responsable des infractions commises pendant la periode de location, des frais administratifs associes, et de tout dommage cause en cas de faute, negligence grave, usage non autorise ou violation du contrat.',
      'En cas d accident, de vol ou de tentative de vol, il doit aviser sans delai l agence et, si necessaire, les autorites competentes, puis transmettre tous documents utiles dans les meilleurs delais.',
      '',
      '6. Kilometrage, carburant et exploitation',
      `Sauf offre contraire ecrite, le kilometrage inclus est plafonne a ${legal.dailyKmLimit} km par jour de location. Tout depassement peut etre facture selon le tarif en vigueur de l agence.`,
      `Le vehicule doit etre restitue avec un niveau de carburant au moins equivalent a celui du depart. A defaut, l appoint de carburant, les frais de service et l immobilisation eventuelle peuvent etre refactures.`,
      '',
      '7. Assurance et franchise',
      'La couverture d assurance applicable est celle effectivement souscrite par l agence. Elle peut comporter exclusions, plafonds, franchise ou conditions de declaration. Le locataire reconnait que certains dommages ou manquements peuvent rester a sa charge.',
      '',
      '8. Resiliation et immobilisation',
      'L agence peut refuser la remise du vehicule, suspendre la location ou resilier le contrat en cas de non-paiement, fausse declaration, document invalide, usage dangereux, non-respect des obligations ou risque manifeste pour le vehicule.',
      '',
      '9. Droit applicable et resolution amiable',
      `Les parties privilegient une resolution amiable et documentee de tout differend. A defaut d accord, le litige sera traite selon le droit applicable en ${legal.country}, devant la juridiction territorialement competente de ${legal.jurisdictionCity}.`
    ].join('\n');
  }

  getPaymentTerms({ booking, totalDays, pricingBreakdown }) {
    const legal = this.getLegalSettings(booking?.vehicle?.agency || null);
    const finalAmount = Number(booking?.finalPrice || booking?.totalPrice || 0);
    const subtotal = Number(pricingBreakdown?.subtotal || 0);
    const discount = Number(pricingBreakdown?.discount || 0);

    return [
      '1. Prix de la location',
      `Le prix journalier de reference est de ${this.formatAmount(pricingBreakdown.pricePerDay)} pour ${totalDays} jour(s), soit un sous-total de ${this.formatAmount(subtotal)}.`,
      discount > 0
        ? `Une reduction de ${this.formatAmount(discount)} a ete appliquee, portant le montant final contractuel a ${this.formatAmount(finalAmount)}.`
        : `Le montant contractuel total a regler est de ${this.formatAmount(finalAmount)}.`,
      '',
      '2. Exigibilite',
      'Sauf mention contraire de l agence, le paiement est exigible avant la remise effective du vehicule. Tout impaye, paiement rejete ou paiement annule peut empecher la livraison ou entrainer la suspension du contrat.',
      '',
      '3. Caution, depot et frais annexes',
      `Une caution ou un depot de garantie peut etre exige par l agence. Le montant de reference est fixe a ${legal.depositAmount}, sauf conditions particulieres plus elevees notifiees avant la remise du vehicule.`,
      'Cette caution ne constitue pas une limite de responsabilite et peut etre completee par toute somme restant due au titre des dommages, franchises, carburant manquant, nettoyage anormal, depannage, peages, contraventions ou immobilisation.',
      '',
      '4. Retard, prolongation et penalites',
      `Toute heure de retard non autorisee peut donner lieu a une penalite indicative de ${legal.lateFeePerHour}, sans prejudice d une journee supplementaire lorsque le depassement le justifie.`,
      'Toute prolongation doit etre demandee avant l heure de retour prevue et n engage l agence qu apres accord exprès et paiement complementaire si applicable.',
      '',
      '5. Annulation et remboursement',
      'Les remboursements, reports ou retenues eventuels sont traites conformement a la politique d annulation applicable a la reservation et aux paiements effectivement encaisses.',
      '',
      '6. Preuve',
      'Les justificatifs de reservation, de paiement, de signature electronique et d echanges transactionnels conserves par la plateforme ou l agence peuvent etre invoques comme elements de preuve.'
    ].join('\n');
  }

  getContractNotes({ booking, vehicle, agency }) {
    const legal = this.getLegalSettings(agency);
    return [
      `Reference reservation: ${booking?.id || '-'}`,
      `Vehicule concerne: ${vehicle?.brand || ''} ${vehicle?.model || ''} (${vehicle?.licensePlate || 'sans immatriculation renseignee'})`,
      `Agence exploitante: ${agency?.name || '-'}${agency?.phone ? ` - ${agency.phone}` : ''}`,
      'Le locataire doit presenter une piece d identite valide et tout document de conduite exige au moment de la remise.',
      'Un etat des lieux depart/retour complete ce contrat et prime pour les constats materiels.',
      `Kilometrage contractuel indicatif: ${legal.dailyKmLimit} km/jour sauf conditions particulieres.`,
      `Depot de garantie indicatif: ${legal.depositAmount}.`,
      `Base juridique et competence: ${legal.country} / ${legal.jurisdictionCity}.`
    ].join('\n');
  }

  getLegalSettings() {
    const agency = arguments[0] || null;
    return {
      country: agency?.contractCountry || process.env.AFRIRIDE_CONTRACT_COUNTRY || 'le pays d exploitation de l agence',
      jurisdictionCity: agency?.contractJurisdictionCity || process.env.AFRIRIDE_CONTRACT_JURISDICTION_CITY || 'la ville du siege de l agence',
      depositAmount: agency?.defaultDepositAmount || process.env.AFRIRIDE_DEFAULT_DEPOSIT_AMOUNT || 'selon la grille de caution de l agence',
      dailyKmLimit: agency?.defaultDailyKmLimit || process.env.AFRIRIDE_DEFAULT_DAILY_KM_LIMIT || '250',
      lateFeePerHour: agency?.defaultLateFeePerHour || process.env.AFRIRIDE_DEFAULT_LATE_FEE_PER_HOUR || 'selon la grille de retard de l agence'
    };
  }

  getPricingBreakdown({ booking, totalDays }) {
    const subtotal = Number(booking?.totalPrice || 0);
    const finalAmount = Number(booking?.finalPrice || subtotal);
    return {
      pricePerDay: Number(booking?.pricePerDay || (totalDays > 0 ? subtotal / totalDays : 0)),
      subtotal,
      discount: Math.max(0, subtotal - finalAmount),
      finalAmount
    };
  }

  getUserIdentityBlock(user) {
    return [
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Client',
      user?.email || 'Email non renseigne',
      user?.phone || 'Telephone non renseigne',
      user?.address || 'Adresse non renseignee'
    ].join('\n');
  }

  getAgencyIdentityBlock(agency) {
    return [
      agency?.name || 'Agence',
      agency?.address || 'Adresse non renseignee',
      agency?.phone || 'Telephone non renseigne',
      agency?.email || 'Email non renseigne'
    ].join('\n');
  }

  getVehicleIdentityBlock(vehicle) {
    return [
      `${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim(),
      `Immatriculation: ${vehicle?.licensePlate || 'N/A'}`,
      `Annee: ${vehicle?.year || 'N/A'}`,
      `Transmission: ${vehicle?.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}`,
      `Carburant: ${this.formatFuelType(vehicle?.fuelType)}`,
      `Places: ${vehicle?.seats || 'N/A'}`
    ].join('\n');
  }

  getTotalDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return totalDays > 0 ? totalDays : 1;
  }

  formatDate(date) {
    const d = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options).replace(/^\w/, (c) => c.toUpperCase());
  }

  formatAmount(value) {
    return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
  }

  generateContractNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `CNT-${year}${month}${day}-${random}`;
  }

  formatFuelType(fuelType) {
    const fuelTypes = {
      petrol: 'Essence',
      diesel: 'Diesel',
      electric: 'Electrique',
      hybrid: 'Hybride'
    };
    return fuelTypes[fuelType] || fuelType || 'Non renseigne';
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

module.exports = new ContractGeneratorService();
