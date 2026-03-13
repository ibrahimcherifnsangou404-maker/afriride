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

  const payload = {
    from,
    to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text
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





