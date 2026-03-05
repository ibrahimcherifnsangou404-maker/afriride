const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Vérifier la connexion
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur configuration email:', error.message);
  } else {
    console.log('✅ Service email configuré');
  }
});

// Service d'emails
const emailService = {
  /**
   * Envoyer email de confirmation d'inscription
   */
  sendConfirmationEmail: async (user, confirmUrl) => {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>📧 Confirmez votre email</h1>
            <p style="font-size: 16px; margin: 0;">AfriRide</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>Merci de vous être inscrit sur AfriRide! Pour activer votre compte et commencer à utiliser nos services, veuillez confirmer votre adresse email.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <a href="${confirmUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Confirmer mon email
              </a>
            </div>

            <p style="font-size: 12px; color: #666; word-break: break-all; text-align: center;">
              Si le bouton ne fonctionne pas, copiez ce lien:<br>
              <a href="${confirmUrl}" style="color: #667eea;">${confirmUrl}</a>
            </p>

            <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #555;">
                ℹ️ <strong>Note:</strong> Si vous n'avez pas créé de compte sur AfriRide, vous pouvez ignorer cet email.
              </p>
            </div>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: '🚀 Confirmez votre inscription sur AfriRide',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de confirmation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email confirmation:', error.message);
      // Ne pas bloquer l'inscription si l'email échoue, mais logger l'erreur
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email de bienvenue (après confirmation)
   */
  sendWelcomeEmail: async (user) => {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>🎉 Bienvenue sur AfriRide!</h1>
            <p style="font-size: 18px; margin: 20px 0;">Bonjour ${user.firstName},</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Nous sommes heureux de vous accueillir!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Vos informations</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Nom:</strong> ${user.firstName} ${user.lastName}</p>
              <p><strong>Téléphone:</strong> ${user.phone}</p>
              <p><strong>Rôle:</strong> ${user.role === 'client' ? 'Client' : user.role === 'manager' ? 'Manager' : 'Administrateur'}</p>
            </div>

            <h3 style="color: #667eea; margin-top: 30px;">Prochaines étapes:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li>✅ Accédez à votre compte</li>
              <li>🚗 Explorez les véhicules disponibles</li>
              <li>💳 Complétez votre profil</li>
              <li>🎁 Gagnez des points de fidélité</li>
            </ol>

            <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #555;">
                ℹ️ <strong>Conseil:</strong> Vérifiez votre email pour toutes les confirmations de réservation et paiement.
              </p>
            </div>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">
              <a href="http://localhost:3000" style="color: #667eea; text-decoration: none;">Site Web</a> | 
              <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: '🎉 Bienvenue sur AfriRide - Confirmez votre email',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenue envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email bienvenue:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email de confirmation de réservation
   */
  sendBookingConfirmationEmail: async (booking, vehicle, user) => {
    try {
      const startDate = new Date(booking.startDate).toLocaleDateString('fr-FR');
      const endDate = new Date(booking.endDate).toLocaleDateString('fr-FR');
      const totalDays = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>✅ Réservation Confirmée!</h1>
            <p style="font-size: 16px; margin: 0;">Référence: <strong>${booking.id.substring(0, 8).toUpperCase()}</strong></p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>Votre réservation a été confirmée avec succès! Voici les détails:</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🚗 Véhicule</h3>
              <p><strong>${vehicle.brand} ${vehicle.model}</strong></p>
              <p style="color: #666; margin: 5px 0;">Plaque: <strong>${vehicle.licensePlate}</strong></p>
              <p style="color: #666; margin: 5px 0;">Type: <strong>${vehicle.fuelType}</strong></p>
              ${vehicle.images && vehicle.images[0] ? `<img src="cid:vehicleImage" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">` : ''}
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📅 Dates</h3>
              <p><strong>Du:</strong> ${startDate}</p>
              <p><strong>Au:</strong> ${endDate}</p>
              <p><strong>Durée:</strong> ${totalDays} jour(s)</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💰 Prix</h3>
              <p><strong>Prix par jour:</strong> ${booking.pricePerDay?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
              <p><strong>Nombre de jours:</strong> ${totalDays}</p>
              <p style="font-size: 18px; border-top: 2px solid #eee; padding-top: 10px;">
                <strong style="color: #667eea;">Total: ${booking.totalPrice?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</strong>
              </p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⚠️ <strong>Statut du paiement:</strong> ${booking.paymentStatus === 'pending' ? '⏳ En attente de paiement' : booking.paymentStatus === 'paid' ? '✅ Payé' : '❌ Erreur'}
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/my-bookings" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Voir votre réservation
              </a>
            </div>

            <h3 style="color: #667eea;">📝 Prochaines étapes:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li>Effectuez le paiement si ce n'est pas encore fait</li>
              <li>Vous recevrez un contrat à signer</li>
              <li>Confirmez la signature du contrat</li>
              <li>Récupérez le véhicule à la date prévue</li>
            </ol>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">Besoin d'aide? <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">support@afriride.com</a></p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: `✅ Réservation confirmée - ${vehicle.brand} ${vehicle.model}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de réservation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email réservation:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email de rappel de paiement
   */
  sendPaymentReminderEmail: async (booking, user) => {
    try {
      const dueDate = new Date(booking.createdAt);
      dueDate.setHours(dueDate.getHours() + 24); // 24h pour payer

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 40px; text-align: center; color: white;">
            <h1>⏰ Rappel de Paiement</h1>
            <p style="font-size: 16px; margin: 0;">Votre paiement est en attente</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>Nous avons noté que votre paiement pour la réservation est toujours en attente.</p>

            <div style="background: #ffe0e0; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
              <p style="margin: 0; color: #c92a2a;">
                <strong>⏰ Délai d'expiration:</strong> ${dueDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px;">💰 Montant à payer</h3>
              <p style="font-size: 24px; color: #333; margin: 20px 0;">
                <strong>${booking.totalPrice?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</strong>
              </p>
              <p style="color: #666; margin: 5px 0;">Référence: <strong>${booking.id.substring(0, 8).toUpperCase()}</strong></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/my-bookings" style="display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">
                Payer maintenant
              </a>
            </div>

            <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #555;">
                <strong>💡 Info:</strong> Votre réservation sera automatiquement annulée si le paiement n'est pas effectué avant la date limite.
              </p>
            </div>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">Besoin d'aide? <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">support@afriride.com</a></p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: '⏰ Rappel de paiement - AfriRide',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de rappel envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email rappel:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer reçu de paiement (PDF)
   */
  sendPaymentReceiptEmail: async (user, payment, booking, pdfBuffer) => {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center; color: white;">
            <h1>✅ Paiement confirmé</h1>
            <p style="font-size: 14px; margin: 0;">AfriRide</p>
          </div>
          <div style="padding: 32px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName || ''},</p>
            <p>Votre paiement a été validé. Vous trouverez votre reçu en pièce jointe.</p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Montant:</strong> ${Number(payment.amount || 0).toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Référence:</strong> ${payment.transactionId || payment.id}</p>
              <p><strong>Réservation:</strong> ${booking?.id?.substring(0, 8)?.toUpperCase() || '-'}</p>
            </div>
            <p style="font-size: 13px; color: #666;">Merci pour votre confiance.</p>
          </div>
          <div style="background: #111827; padding: 16px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: 'Reçu de paiement - AfriRide',
        html: htmlContent,
        attachments: pdfBuffer
          ? [
              {
                filename: `Recu_${payment.id}.pdf`,
                content: pdfBuffer
              }
            ]
          : []
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email reçu paiement envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi reçu paiement:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email avec contrat PDF
   */
  sendContractEmail: async (contract, user, pdfPath) => {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>📋 Votre Contrat est Prêt</h1>
            <p style="font-size: 16px; margin: 0;">Contrat #${contract.contractNumber}</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>Votre contrat de location a été généré et est prêt à être signé.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Détails du Contrat</h3>
              <p><strong>Numéro:</strong> ${contract.contractNumber}</p>
              <p><strong>Statut:</strong> ${contract.status === 'draft' ? '⏳ Brouillon' : contract.status === 'active' ? '✅ Actif' : contract.status}</p>
              <p><strong>Date début:</strong> ${new Date(contract.startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date fin:</strong> ${new Date(contract.endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Montant:</strong> ${contract.totalAmount?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ✍️ <strong>Action requise:</strong> Veuillez télécharger et consulter le PDF ci-joint, puis signer le contrat dans votre espace personnel.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/contracts/${contract.id}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Signer le Contrat
              </a>
            </div>

            <h3 style="color: #667eea;">📝 Prochaines étapes:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li>Consultez le PDF en pièce jointe</li>
              <li>Signez le contrat en ligne</li>
              <li>Attendez la signature de l'agence</li>
              <li>Confirmez la réception du véhicule</li>
            </ol>

            <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #555;">
                <strong>💡 Info:</strong> Le PDF est fourni pour votre référence. Les signatures se font entièrement en ligne via notre plateforme sécurisée.
              </p>
            </div>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">Besoin d'aide? <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">support@afriride.com</a></p>
          </div>
        </div>
      `;

      const attachments = [];
      if (pdfPath && fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `Contrat_${contract.contractNumber}.pdf`,
          path: pdfPath
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: `📋 Contrat de Location - ${contract.contractNumber}`,
        html: htmlContent,
        attachments: attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email contrat envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email contrat:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email de notification de signature
   */
  sendSignatureNotificationEmail: async (contract, user, whoSigned) => {
    try {
      const isBothSigned = contract.clientSignatureDate && contract.agencySignatureDate;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${isBothSigned ? '#4caf50' : '#667eea'} 0%, ${isBothSigned ? '#45a049' : '#764ba2'} 100%); padding: 40px; text-align: center; color: white;">
            <h1>${isBothSigned ? '✅ Contrat Complètement Signé!' : '✍️ Notification de Signature'}</h1>
            <p style="font-size: 16px; margin: 0;">Contrat #${contract.contractNumber}</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>${whoSigned === 'client' ? 'Nous confirmons que vous avez signé le contrat.' : 'L\'agence a signé le contrat.'}</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Statut des Signatures</h3>
              <p>
                ${contract.clientSignatureDate ? '✅ Client signé le ' + new Date(contract.clientSignatureDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '⏳ Client - En attente'}
              </p>
              <p>
                ${contract.agencySignatureDate ? '✅ Agence signée le ' + new Date(contract.agencySignatureDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '⏳ Agence - En attente'}
              </p>
            </div>

            ${isBothSigned ? `
            <div style="background: #d4edda; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <p style="margin: 0; color: #155724;">
                🎉 <strong>Contrat actif!</strong> Toutes les signatures ont été collectées. Vous pouvez procéder à la récupération du véhicule.
              </p>
            </div>
            ` : `
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⏳ <strong>En attente:</strong> ${whoSigned === 'client' ? 'L\'agence doit encore signer le contrat.' : 'Vous devez signer le contrat.'}
              </p>
            </div>
            `}

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/contracts/${contract.id}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Voir le Contrat
              </a>
            </div>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">Besoin d'aide? <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">support@afriride.com</a></p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: `${isBothSigned ? '✅ Contrat Signé' : '✍️ Signature en attente'} - ${contract.contractNumber}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de signature envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email signature:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer email de réinitialisation de mot de passe
   */
  sendPasswordResetEmail: async (user, resetUrl) => {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>🔐 Réinitialisation de Mot de Passe</h1>
            <p style="font-size: 16px; margin: 0;">AfriRide</p>
          </div>
          
          <div style="padding: 40px; background: #f5f5f5;">
            <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe AfriRide.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🔑 Instructions</h3>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Réinitialiser mon mot de passe
                </a>
              </div>

              <p style="font-size: 12px; color: #666; word-break: break-all;">
                Ou copiez ce lien dans votre navigateur:<br>
                <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
              </p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⏰ <strong>Important:</strong> Ce lien expirera dans <strong>1 heure</strong>.
              </p>
            </div>

            <div style="background: #ffe0e0; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
              <p style="margin: 0; color: #c92a2a;">
                ⚠️ <strong>Sécurité:</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
              </p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Besoin d'aide? Contactez notre support à <a href="mailto:support@afriride.com" style="color: #667eea;">support@afriride.com</a>
            </p>
          </div>

          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
            <p style="margin: 5px 0; font-size: 12px;">
              <a href="http://localhost:5173" style="color: #667eea; text-decoration: none;">Site Web</a> | 
              <a href="mailto:support@afriride.com" style="color: #667eea; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@afriride.com',
        to: user.email,
        subject: '🔐 Réinitialisation de votre mot de passe AfriRide',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de réinitialisation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email réinitialisation:', error.message);
      throw error; // Propager l'erreur pour que le controller puisse la gérer
    }
  }
};

module.exports = emailService;
