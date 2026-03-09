// smsService.js
let twilioClient = null;

// Initialiser Twilio seulement si les clés sont présentes
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN
) {
  const twilio = require('twilio');
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✅ Service SMS Twilio activé');
} else {
  console.warn('⚠️  Service SMS Twilio désactivé (clés non configurées)');
}

const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.warn('SMS non envoyé : Twilio non configuré');
    return null;
  }
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return result;
  } catch (error) {
    console.error('Erreur envoi SMS:', error.message);
    return null;
  }
};

module.exports = { sendSMS, twilioClient };