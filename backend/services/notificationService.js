const admin = require('firebase-admin');
const serviceAccount = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;

// Initialiser Firebase (optionnel)
let firebaseApp = null;

if (serviceAccount) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Service Push Notifications Firebase configuré');
  } catch (error) {
    console.log('⚠️  Firebase non configuré:', error.message);
  }
} else {
  console.log('⚠️  Service Push Notifications Firebase désactivé');
}

const notificationService = {
  /**
   * Envoyer notification push générique
   */
  sendPushNotification: async (userId, title, body, data = {}) => {
    try {
      if (!firebaseApp) {
        console.log('⚠️  Push désactivé, notification non envoyée:', {
          userId,
          title,
          body
        });
        return { success: false, error: 'Service push désactivé' };
      }

      // Récupérer les tokens FCM de l'utilisateur depuis une table
      // Pour maintenant, juste un exemple
      const payload = {
        notification: {
          title: title,
          body: body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      };

      console.log('✅ Notification push créée:', { title, body });
      return { success: true, payload };
    } catch (error) {
      console.error('❌ Erreur notification push:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notification: Réservation confirmée
   */
  notifyBookingConfirmed: async (userId, vehicleName, bookingRef) => {
    return await notificationService.sendPushNotification(
      userId,
      '✅ Réservation Confirmée',
      `Votre réservation pour ${vehicleName} est confirmée`,
      {
        type: 'booking_confirmed',
        bookingRef: bookingRef,
        action: 'view_booking',
        url: `/my-bookings`
      }
    );
  },

  /**
   * Notification: Paiement en attente
   */
  notifyPaymentPending: async (userId, amount, bookingRef) => {
    return await notificationService.sendPushNotification(
      userId,
      '⏰ Paiement en Attente',
      `Paiement de ${amount}F à effectuer urgemment`,
      {
        type: 'payment_pending',
        amount: amount,
        bookingRef: bookingRef,
        action: 'pay',
        url: `/my-bookings`
      }
    );
  },

  /**
   * Notification: Paiement accepté
   */
  notifyPaymentConfirmed: async (userId, contractRef) => {
    return await notificationService.sendPushNotification(
      userId,
      '✅ Paiement Accepté',
      `Votre contrat ${contractRef} a été généré`,
      {
        type: 'payment_confirmed',
        contractRef: contractRef,
        action: 'view_contract',
        url: `/contracts/${contractRef}`
      }
    );
  },

  /**
   * Notification: En attente de signature
   */
  notifySignaturePending: async (userId, contractRef, whoMustSign) => {
    return await notificationService.sendPushNotification(
      userId,
      '✍️ Signature en Attente',
      `Le contrat ${contractRef} attend la signature de ${whoMustSign}`,
      {
        type: 'signature_pending',
        contractRef: contractRef,
        whoMustSign: whoMustSign,
        action: 'sign_contract',
        url: `/contracts/${contractRef}`
      }
    );
  },

  /**
   * Notification: Contrat signé
   */
  notifyContractSigned: async (userId, contractRef, whoSigned) => {
    return await notificationService.sendPushNotification(
      userId,
      '✍️ Contrat Signé',
      `Le contrat ${contractRef} a été signé par ${whoSigned}`,
      {
        type: 'contract_signed',
        contractRef: contractRef,
        whoSigned: whoSigned,
        action: 'view_contract',
        url: `/contracts/${contractRef}`
      }
    );
  },

  /**
   * Notification: Contrat complètement signé
   */
  notifyContractComplete: async (userId, contractRef) => {
    return await notificationService.sendPushNotification(
      userId,
      '🎉 Contrat Complet',
      `Toutes les signatures du contrat ${contractRef} sont collectées. Vous pouvez récupérer le véhicule.`,
      {
        type: 'contract_complete',
        contractRef: contractRef,
        action: 'view_contract',
        url: `/contracts/${contractRef}`
      }
    );
  },

  /**
   * Envoyer à plusieurs utilisateurs
   */
  sendBulkNotifications: async (userIds, title, body, data = {}) => {
    try {
      const results = await Promise.all(
        userIds.map(userId =>
          notificationService.sendPushNotification(userId, title, body, data)
        )
      );
      return { success: true, results };
    } catch (error) {
      console.error('❌ Erreur envoi bulk notifications:', error.message);
      return { success: false, error: error.message };
    }
  }
};

module.exports = notificationService;
