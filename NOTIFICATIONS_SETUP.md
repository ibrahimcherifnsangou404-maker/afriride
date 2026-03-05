# 📧 SYSTÈME DE NOTIFICATIONS & EMAILS

## 📋 Vue d'ensemble

Le système de notifications comprend:
- ✉️ **Emails HTML** personnalisés
- 💬 **SMS** (via Twilio)
- 🔔 **Push Notifications** (via Firebase)
- 📄 **PDF** générés automatiquement

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd backend
npm install nodemailer twilio pdfkit firebase-admin
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `backend/`:

```env
# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app_gmail
EMAIL_FROM=noreply@afriride.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (optionnel)
FIREBASE_CONFIG={"type":"service_account",...}
```

---

## 📧 SERVICE EMAIL

### Fichier: `backend/services/emailService.js`

**Fonctions disponibles:**

#### 1. Email de bienvenue
```javascript
await emailService.sendWelcomeEmail(user);
```
- **Quand:** À l'inscription
- **Contient:** Bienvenue, infos utilisateur, prochaines étapes
- **Intégration:** Dans `authController.register()`

#### 2. Confirmation de réservation
```javascript
await emailService.sendBookingConfirmationEmail(booking, vehicle, user);
```
- **Quand:** Après création de réservation
- **Contient:** Détails véhicule, dates, prix
- **Intégration:** Dans `bookingController.createBooking()`

#### 3. Rappel de paiement
```javascript
await emailService.sendPaymentReminderEmail(booking, user);
```
- **Quand:** Si paiement non effectué (optionnel - job planifié)
- **Contient:** Montant, date limite, appel à action
- **Intégration:** Dans un job CRON

#### 4. Contrat PDF
```javascript
await emailService.sendContractEmail(contract, user, pdfPath);
```
- **Quand:** Après validation du paiement
- **Contient:** Contrat en PDF joint, instructions signature
- **Intégration:** Dans `paymentController`

#### 5. Notification de signature
```javascript
await emailService.sendSignatureNotificationEmail(contract, user, whoSigned);
```
- **Quand:** Quand quelqu'un signe le contrat
- **Contient:** Statut signatures, call-to-action
- **Intégration:** Dans `contractController.signContractAsClient()` et `signContractAsAgency()`

---

## 💬 SERVICE SMS

### Fichier: `backend/services/smsService.js`

**Fonctions disponibles:**

#### 1. SMS de confirmation de réservation
```javascript
await smsService.sendBookingConfirmationSMS(phone, vehicleName, bookingRef);
```

#### 2. SMS de rappel de paiement
```javascript
await smsService.sendPaymentReminderSMS(phone, totalPrice, bookingRef);
```

#### 3. SMS signature en attente
```javascript
await smsService.sendSignaturePendingSMS(phone, contractRef);
```

#### 4. SMS paiement confirmé
```javascript
await smsService.sendPaymentConfirmedSMS(phone, contractRef);
```

**Note:** SMS désactivé par défaut (affiche logs). Pour activer, configurez Twilio.

---

## 🔔 NOTIFICATIONS PUSH

### Fichier: `backend/services/notificationService.js`

**Fonctions disponibles:**

#### 1. Réservation confirmée
```javascript
await notificationService.notifyBookingConfirmed(userId, vehicleName, bookingRef);
```

#### 2. Paiement en attente
```javascript
await notificationService.notifyPaymentPending(userId, amount, bookingRef);
```

#### 3. Paiement accepté
```javascript
await notificationService.notifyPaymentConfirmed(userId, contractRef);
```

#### 4. Signature en attente
```javascript
await notificationService.notifySignaturePending(userId, contractRef, whoMustSign);
```

#### 5. Contrat signé
```javascript
await notificationService.notifyContractSigned(userId, contractRef, whoSigned);
```

#### 6. Contrat complètement signé
```javascript
await notificationService.notifyContractComplete(userId, contractRef);
```

---

## 📄 SERVICE PDF

### Fichier: `backend/services/pdfService.js`

**Fonctions disponibles:**

#### 1. Générer PDF du contrat
```javascript
const pdfPath = await pdfService.generateContractPDF(
  contract,
  vehicle,
  client,
  agency
);
```
- **Retourne:** Chemin du fichier PDF
- **Stockage:** `backend/documents/Contrat_XXX.pdf`
- **Contient:** Numéro contrat, parties, véhicule, dates, tarification, signatures

#### 2. Générer reçu de paiement
```javascript
const pdfPath = await pdfService.generatePaymentReceiptPDF(
  payment,
  booking,
  user
);
```
- **Stockage:** `backend/documents/Recu_XXX.pdf`

---

## 🔌 INTÉGRATIONS DANS LES CONTRÔLEURS

### authController.js
```javascript
const emailService = require('../services/emailService');

// Dans register():
emailService.sendWelcomeEmail(user).catch(err => 
  console.error('Erreur email:', err.message)
);
```

### bookingController.js
```javascript
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Dans createBooking():
emailService.sendBookingConfirmationEmail(booking, vehicle, user).catch(...);
smsService.sendBookingConfirmationSMS(user.phone, vehicleName, bookingId).catch(...);
```

### paymentController.js
```javascript
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const pdfService = require('../services/pdfService');
const notificationService = require('../services/notificationService');

// Dans le callback setTimeout après validation:
const pdfPath = await pdfService.generateContractPDF(contract, vehicle, user, agency);
await emailService.sendContractEmail(contract, user, pdfPath);
await smsService.sendPaymentConfirmedSMS(user.phone, contractNumber);
await notificationService.notifyPaymentConfirmed(user.id, contractNumber);
```

### contractController.js
```javascript
// Dans signContractAsClient():
emailService.sendSignatureNotificationEmail(contract, user, 'client').catch(...);
smsService.sendSignaturePendingSMS(user.phone, contractNumber).catch(...);
notificationService.notifySignaturePending(...).catch(...);

// Dans signContractAsAgency():
emailService.sendSignatureNotificationEmail(contract, user, 'agency').catch(...);
notificationService.notifyContractComplete(...).catch(...);
```

---

## 🧪 TEST DES EMAILS

### 1. Test avec Mailtrap (Service gratuit)

```bash
# 1. Créer compte sur https://mailtrap.io
# 2. Copier les credentials
# 3. Remplacer dans .env:
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=xxxxx
EMAIL_PASSWORD=xxxxx
```

### 2. Test avec Gmail

```bash
# 1. Activer les apps moins sécurisées
# https://myaccount.google.com/lesssecureapps

# 2. Générer mot de passe d'app
# https://myaccount.google.com/apppasswords

# 3. Ajouter au .env:
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=mot_de_passe_app_google
```

### 3. Script de test manuel

```javascript
// Dans un fichier test.js
const emailService = require('./services/emailService');

const testUser = {
  id: '123',
  firstName: 'Test',
  lastName: 'User',
  email: 'votre_email@gmail.com',
  phone: '+221771234567'
};

emailService.sendWelcomeEmail(testUser).then(result => {
  console.log('Test result:', result);
  process.exit(0);
});
```

```bash
node test.js
```

---

## 🔐 CONFIGURATION SÉCURITÉ

### Gmail - App Passwords

1. Activer 2FA sur compte Google
2. Générer App Password:
   - Aller sur https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et "Windows Computer"
   - Copier le mot de passe généré
   - L'ajouter au .env

### Twilio

1. Créer compte sur https://www.twilio.com
2. Copier Account SID et Auth Token
3. Acheter un numéro Twilio
4. Ajouter au .env

### Firebase

1. Créer projet sur https://console.firebase.google.com
2. Télécharger JSON de clé
3. Convertir en string et ajouter au .env

---

## 📊 FLUX DE NOTIFICATIONS

```
INSCRIPTION
    ↓
[Email bienvenue] → Utilisateur
    ↓

CRÉATION RÉSERVATION
    ↓
[Email confirmation] → Client
[SMS confirmation] → Client
    ↓

PAIEMENT VALIDATION
    ↓
[Générer PDF] → backend/documents/
[Email contrat + PDF] → Client
[SMS paiement confirmé] → Client
[Push notification] → Client
[Créer contrat auto] → Base de données
    ↓

SIGNATURE CLIENT
    ↓
[Email notification] → Agence
[SMS notification] → Client
[Push notification] → Agence
    ↓

SIGNATURE AGENCE
    ↓
[Email notification] → Client
[Push notification] → Client
[SMS notification] → Client
    ↓

CONTRAT COMPLET
    ↓
[Push notification] → Client
[Email confirmation] → Les deux parties
```

---

## 🛠️ DÉPANNAGE

### Erreur: "EAUTH Invalid login credentials"
- Vérifier EMAIL_USER et EMAIL_PASSWORD
- Pour Gmail, utiliser App Password (pas le mot de passe du compte)

### Email non reçu?
- Vérifier le dossier spam
- Vérifier les logs du serveur: `[emailService]`
- Tester avec Mailtrap d'abord

### SMS non envoyés?
- Vérifier TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN
- Vérifier que le compte Twilio a des crédits
- Les SMS affichent "disabled" dans les logs si non configuré

### PDF non généré?
- Vérifier que `backend/documents/` existe
- Vérifier les permissions en écriture

---

## 📈 PROCHAINES ÉTAPES

1. **Tâches planifiées (CRON)**
   - Rappels de paiement 24h après réservation
   - Rappels de signature
   - Nettoyage des PDFs anciens

2. **Webhooks**
   - SMS de livraison confirmée
   - Email de retour du véhicule

3. **Personnalisation**
   - Thème email par agence
   - Logos personnalisés
   - Couleurs branded

4. **Analytics**
   - Taux d'ouverture emails
   - Taux de livraison SMS
   - Conversion après notification

---

**Date:** 13 Janvier 2026  
**Version:** 1.0.0  
**Status:** ✅ COMPLÈTE
