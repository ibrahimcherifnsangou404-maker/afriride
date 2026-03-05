const twilio = require('twilio');

// Initialiser Twilio (optionnel - si clés configurées)
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Service SMS Twilio configuré');
} else {
  console.log('⚠️  Service SMS Twilio désactivé (clés non configurées)');
}

const smsService = {
  /**
   * Envoyer SMS de confirmation de réservation
   */
  sendBookingConfirmationSMS: async (phone, vehicleName, bookingRef) => {
    try {
      if (!twilioClient) {
        console.log('⚠️  SMS désactivé, texte non envoyé:', {
          phone,
          message: `✅ Réservation confirmée! ${vehicleName} - Ref: ${bookingRef.substring(0, 8).toUpperCase()}`
        });
        return { success: false, error: 'Service SMS désactivé' };
      }

      const message = await twilioClient.messages.create({
        body: `✅ Réservation confirmée! ${vehicleName} - Ref: ${bookingRef.substring(0, 8).toUpperCase()}. Voir détails: https://afriride.com`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('✅ SMS de réservation envoyé:', message.sid);
      return { success: true, messageSid: message.sid };
    } catch (error) {
      console.error('❌ Erreur envoi SMS réservation:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer SMS de rappel de paiement
   */
  sendPaymentReminderSMS: async (phone, totalPrice, bookingRef) => {
    try {
      if (!twilioClient) {
        console.log('⚠️  SMS désactivé, texte non envoyé:', {
          phone,
          message: `⏰ Rappel: Paiement ${totalPrice}F en attente. Ref: ${bookingRef.substring(0, 8).toUpperCase()}`
        });
        return { success: false, error: 'Service SMS désactivé' };
      }

      const message = await twilioClient.messages.create({
        body: `⏰ Rappel: Paiement ${totalPrice}F en attente. Ref: ${bookingRef.substring(0, 8).toUpperCase()}. Payer: https://afriride.com`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('✅ SMS de rappel envoyé:', message.sid);
      return { success: true, messageSid: message.sid };
    } catch (error) {
      console.error('❌ Erreur envoi SMS rappel:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer SMS de signature en attente
   */
  sendSignaturePendingSMS: async (phone, contractRef) => {
    try {
      if (!twilioClient) {
        console.log('⚠️  SMS désactivé, texte non envoyé:', {
          phone,
          message: `✍️ Contrat ${contractRef} en attente de signature. Signer: https://afriride.com`
        });
        return { success: false, error: 'Service SMS désactivé' };
      }

      const message = await twilioClient.messages.create({
        body: `✍️ Contrat ${contractRef} en attente de signature. Signer: https://afriride.com`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('✅ SMS signature en attente envoyé:', message.sid);
      return { success: true, messageSid: message.sid };
    } catch (error) {
      console.error('❌ Erreur envoi SMS signature:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer SMS de paiement accepté
   */
  sendPaymentConfirmedSMS: async (phone, contractRef) => {
    try {
      if (!twilioClient) {
        console.log('⚠️  SMS désactivé, texte non envoyé:', {
          phone,
          message: `✅ Paiement accepté! Contrat ${contractRef} généré. Vérifier: https://afriride.com`
        });
        return { success: false, error: 'Service SMS désactivé' };
      }

      const message = await twilioClient.messages.create({
        body: `✅ Paiement accepté! Contrat ${contractRef} généré. Vérifier: https://afriride.com`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('✅ SMS paiement confirmé envoyé:', message.sid);
      return { success: true, messageSid: message.sid };
    } catch (error) {
      console.error('❌ Erreur envoi SMS paiement:', error.message);
      return { success: false, error: error.message };
    }
  }
};

module.exports = smsService;
