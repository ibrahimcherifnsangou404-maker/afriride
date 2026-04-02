const nodemailer = require('nodemailer');
const fs = require('fs');

// Vérifier si l'email est configuré
const isEmailConfigured = !!(
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.EMAIL_USER !== 'votre_email@gmail.com'
);

const isResendConfigured = !!process.env.RESEND_API_KEY;

// Configuration du transporteur email
let transporter = null;

if (isEmailConfigured && !isResendConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Vérifier la connexion seulement si configuré
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Erreur configuration email:', error.message);
    } else {
      console.log('✅ Service email configuré');
    }
  });
} else {
  if (isResendConfigured) {
    console.log('✅ Service email configuré via Resend');
  } else {
    console.warn('⚠️  Service Email désactivé (clés non configurées)');
  }
}

const sendEmailViaResend = async (mailOptions) => {
  const from = mailOptions.from || process.env.EMAIL_FROM;
  if (!from) {
    return { success: false, error: 'EMAIL_FROM manquant' };
  }

  const attachments = Array.isArray(mailOptions.attachments)
    ? mailOptions.attachments
        .map((attachment) => {
          if (!attachment?.filename) {
            return null;
          }

          try {
            if (attachment.content) {
              const buffer = Buffer.isBuffer(attachment.content)
                ? attachment.content
                : Buffer.from(attachment.content);

              return {
                filename: attachment.filename,
                content: buffer.toString('base64')
              };
            }

            if (attachment.path && fs.existsSync(attachment.path)) {
              return {
                filename: attachment.filename,
                content: fs.readFileSync(attachment.path).toString('base64')
              };
            }
          } catch (error) {
            console.error('Erreur preparation piece jointe email:', error.message);
          }

          return null;
        })
        .filter(Boolean)
    : [];

  const payload = {
    from,
    to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
    attachments
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || `HTTP ${response.status}`;
      return { success: false, error: message };
    }
    return { success: true, messageId: data?.id };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur Resend' };
  } finally {
    clearTimeout(timeout);
  }
};
// Fonction helper pour envoyer un email
const sendEmail = async (mailOptions) => {
  if (isResendConfigured) {
    const result = await sendEmailViaResend(mailOptions);
    if (result.success) {
      console.log('✅ Email envoyé (Resend):', result.messageId);
    } else {
      console.error('❌ Erreur envoi email (Resend):', result.error);
    }
    return result;
  }

  if (!transporter) {
    console.warn('📧 Email non envoyé (service désactivé):', mailOptions.subject);
    return { success: false, error: 'Service email non configuré' };
  }
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return { success: false, error: error.message };
  }
};

// Service d'emails
const emailService = {
  isAvailable: () => isResendConfigured || Boolean(transporter),

  sendConfirmationEmail: async (user, confirmUrl) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
          <h1>📧 Confirmez votre email</h1>
          <p style="font-size: 16px; margin: 0;">AfriRide</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
          <p>Merci de vous être inscrit sur AfriRide! Pour activer votre compte, veuillez confirmer votre adresse email.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <a href="${confirmUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Confirmer mon email
            </a>
          </div>
          <p style="font-size: 12px; color: #666; word-break: break-all; text-align: center;">
            Si le bouton ne fonctionne pas: <a href="${confirmUrl}" style="color: #667eea;">${confirmUrl}</a>
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: '🚀 Confirmez votre inscription sur AfriRide',
      html: htmlContent
    });
  },

  sendVerificationCodeEmail: async (user, confirmationCode, expiryMinutes = 10) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
          <h1>Code de verification email</h1>
          <p style="font-size: 16px; margin: 0;">AfriRide</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName},</p>
          <p>Merci de vous etre inscrit sur AfriRide. Saisissez ce code pour confirmer que cette adresse email vous appartient.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #111827;">
              ${confirmationCode}
            </div>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">Ce code expire dans ${expiryMinutes} minutes.</p>
          <p style="font-size: 12px; color: #666; text-align: center;">Si vous n'etes pas a l'origine de cette inscription, ignorez simplement cet email.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits reserves</p>
        </div>
      </div>
    `;

    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: 'Code de verification AfriRide',
      html: htmlContent
    });
  },

  sendWelcomeEmail: async (user) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
          <h1>🎉 Bienvenue sur AfriRide!</h1>
          <p style="font-size: 18px; margin: 20px 0;">Bonjour ${user.firstName},</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Nous sommes heureux de vous accueillir!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Nom:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Téléphone:</strong> ${user.phone}</p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: '🎉 Bienvenue sur AfriRide',
      html: htmlContent
    });
  },

  sendKycApprovedEmail: async (user) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; color: white;">
          <h1>Identite verifiee</h1>
          <p style="font-size: 18px; margin: 12px 0 0;">Votre compte client est maintenant valide</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Bonjour ${user.firstName || ''},</p>
          <p>Bonne nouvelle: votre verification KYC a ete approuvee avec succes.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 12px;"><strong>Statut:</strong> Compte verifie</p>
            <p style="margin: 0;"><strong>Vous pouvez maintenant commencer a louer des vehicules sur AfriRide.</strong></p>
          </div>
          <p>Connectez-vous a votre espace client pour parcourir les vehicules disponibles et effectuer votre premiere reservation.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits reserves</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: 'Compte verifie - Vous pouvez commencer a louer',
      html: htmlContent
    });
  },

  sendBookingConfirmationEmail: async (booking, vehicle, user) => {
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
          <p>Bonjour ${user.firstName}, votre réservation a été confirmée!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Véhicule:</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Du:</strong> ${startDate} <strong>Au:</strong> ${endDate}</p>
            <p><strong>Durée:</strong> ${totalDays} jour(s)</p>
            <p><strong>Total:</strong> ${booking.totalPrice?.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: `✅ Réservation confirmée - ${vehicle.brand} ${vehicle.model}`,
      html: htmlContent
    });
  },

  sendPaymentReminderEmail: async (booking, user) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 40px; text-align: center; color: white;">
          <h1>⏰ Rappel de Paiement</h1>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p>Bonjour ${user.firstName}, votre paiement est en attente.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Montant:</strong> ${booking.totalPrice?.toLocaleString('fr-FR')} FCFA</p>
            <p><strong>Référence:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: '⏰ Rappel de paiement - AfriRide',
      html: htmlContent
    });
  },

  sendPaymentReceiptEmail: async (user, payment, booking, pdfBuffer) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: 'Reçu de paiement - AfriRide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 32px; text-align: center; color: white;">
            <h1>✅ Paiement confirmé</h1>
          </div>
          <div style="padding: 32px; background: #f5f5f5;">
            <p>Bonjour ${user.firstName || ''},</p>
            <p>Votre paiement a été validé. Vous trouverez votre reçu en pièce jointe.</p>
            <div style="background: white; padding: 16px; border-radius: 8px;">
              <p><strong>Montant:</strong> ${Number(payment.amount || 0).toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Référence:</strong> ${payment.transactionId || payment.id}</p>
            </div>
          </div>
          <div style="background: #111827; padding: 16px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide</p>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [{ filename: `Recu_${payment.id}.pdf`, content: pdfBuffer }] : []
    };
    return sendEmail(mailOptions);
  },

  sendContractEmail: async (contract, user, pdfPath) => {
    const attachments = [];
    if (pdfPath && fs.existsSync(pdfPath)) {
      attachments.push({ filename: `Contrat_${contract.contractNumber}.pdf`, path: pdfPath });
    }
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: `📋 Contrat de Location - ${contract.contractNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>📋 Votre Contrat est Prêt</h1>
            <p>Contrat #${contract.contractNumber}</p>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <p>Bonjour ${user.firstName}, votre contrat de location a été généré.</p>
            <p><strong>Du:</strong> ${new Date(contract.startDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Au:</strong> ${new Date(contract.endDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Montant:</strong> ${contract.totalAmount?.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
          </div>
        </div>
      `,
      attachments
    });
  },

  sendContractAcceptanceNotification: async (user, booking, agency) => {
    const startDate = booking?.startDate
      ? new Date(booking.startDate).toLocaleDateString('fr-FR')
      : 'N/A';
    const endDate = booking?.endDate
      ? new Date(booking.endDate).toLocaleDateString('fr-FR')
      : 'N/A';
    const vehicleLabel = booking?.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : 'votre vehicule';

    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: `Contrat accepte - ${vehicleLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; color: white;">
            <h1>Contrat accepte</h1>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <p>Bonjour ${user.firstName || ''},</p>
            <p>Nous avons bien enregistre l'acceptation de votre contrat de location.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Vehicule:</strong> ${vehicleLabel}</p>
              <p><strong>Periode:</strong> du ${startDate} au ${endDate}</p>
              <p><strong>Agence:</strong> ${agency?.name || 'AfriRide'}</p>
            </div>
            <p>Vous pouvez suivre la suite du dossier depuis votre espace client.</p>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits reserves</p>
          </div>
        </div>
      `
    });
  },

  sendSignatureNotificationEmail: async (contract, user, whoSigned) => {
    const isBothSigned = contract.clientSignatureDate && contract.agencySignatureDate;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: `${isBothSigned ? '✅ Contrat Signé' : '✍️ Signature en attente'} - ${contract.contractNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>${isBothSigned ? '✅ Contrat Complètement Signé!' : '✍️ Notification de Signature'}</h1>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <p>Bonjour ${user.firstName},</p>
            <p>${whoSigned === 'client' ? 'Vous avez signé le contrat.' : "L'agence a signé le contrat."}</p>
            <p>${contract.clientSignatureDate ? '✅ Client signé' : '⏳ Client en attente'}</p>
            <p>${contract.agencySignatureDate ? '✅ Agence signée' : '⏳ Agence en attente'}</p>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
          </div>
        </div>
      `
    });
  },

  // Notification au manager quand un client fait une réservation
  sendNewBookingManagerEmail: async (manager, booking, vehicle, client) => {
    const startDate = new Date(booking.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(booking.endDate).toLocaleDateString('fr-FR');
    const totalDays = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center; color: white;">
          <h1>🔔 Nouvelle Réservation</h1>
          <p style="font-size: 16px; margin: 0;">Une nouvelle réservation attend votre validation</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Bonjour ${manager.firstName},</p>
          <p>Le client <strong>${client.firstName} ${client.lastName}</strong> vient de réserver l'un de vos véhicules.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 8px 0;"><strong>🚗 Véhicule :</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.year || ''})</p>
            <p style="margin: 8px 0;"><strong>📅 Du :</strong> ${startDate} <strong>au</strong> ${endDate}</p>
            <p style="margin: 8px 0;"><strong>⏱ Durée :</strong> ${totalDays} jour(s)</p>
            <p style="margin: 8px 0;"><strong>💰 Montant :</strong> ${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA</p>
            <p style="margin: 8px 0;"><strong>👤 Client :</strong> ${client.firstName} ${client.lastName}</p>
            <p style="margin: 8px 0;"><strong>📧 Email client :</strong> ${client.email}</p>
            <p style="margin: 8px 0;"><strong>📱 Téléphone :</strong> ${client.phone}</p>
            ${booking.notes ? `<p style="margin: 8px 0;"><strong>📝 Notes :</strong> ${booking.notes}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">Connectez-vous à votre tableau de bord pour valider ou refuser cette réservation.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: manager.email,
      subject: `🔔 Nouvelle réservation - ${vehicle.brand} ${vehicle.model} (${startDate} → ${endDate})`,
      html: htmlContent
    });
  },

  // Notification au client quand le manager valide sa réservation
  sendBookingApprovedClientEmail: async (client, booking, vehicle, agency) => {
    const startDate = new Date(booking.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(booking.endDate).toLocaleDateString('fr-FR');
    const totalDays = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; color: white;">
          <h1>✅ Réservation Confirmée !</h1>
          <p style="font-size: 18px; margin: 0;">Votre réservation a été validée par l'agence</p>
        </div>
        <div style="padding: 40px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Bonjour ${client.firstName},</p>
          <p>Excellente nouvelle ! L'agence <strong>${agency?.name || 'AfriRide'}</strong> a confirmé votre réservation.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 8px 0;"><strong>🚗 Véhicule :</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.year || ''})</p>
            <p style="margin: 8px 0;"><strong>📅 Du :</strong> ${startDate} <strong>au</strong> ${endDate}</p>
            <p style="margin: 8px 0;"><strong>⏱ Durée :</strong> ${totalDays} jour(s)</p>
            <p style="margin: 8px 0;"><strong>💰 Montant total :</strong> ${Number(booking.totalPrice).toLocaleString('fr-FR')} FCFA</p>
            ${agency ? `<p style="margin: 8px 0;"><strong>📍 Agence :</strong> ${agency.name}${agency.address ? ' - ' + agency.address : ''}</p>` : ''}
            ${agency?.phone ? `<p style="margin: 8px 0;"><strong>📞 Contact agence :</strong> ${agency.phone}</p>` : ''}
          </div>
          <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              💡 <strong>Prochaine étape :</strong> Procédez au paiement depuis votre espace "Mes Réservations" pour finaliser la location.
            </p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
        </div>
      </div>
    `;
    return sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: client.email,
      subject: `✅ Réservation confirmée - ${vehicle.brand} ${vehicle.model} du ${startDate} au ${endDate}`,
      html: htmlContent
    });
  },

  sendPasswordResetEmail: async (user, resetUrl) => {
    const result = await sendEmail({
      from: process.env.EMAIL_FROM || 'noreply@afriride.com',
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe AfriRide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1>🔐 Réinitialisation de Mot de Passe</h1>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <p>Bonjour ${user.firstName},</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #856404;">⏰ Ce lien expirera dans 1 heure.</p>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">© 2026 AfriRide - Tous droits réservés</p>
          </div>
        </div>
      `
    });
    if (!result.success && isEmailConfigured) throw new Error(result.error);
    return result;
  }
};

module.exports = emailService;





