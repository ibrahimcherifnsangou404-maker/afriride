# 📧 GUIDE CONFIGURATION EMAIL GMAIL

## ✅ ÉTAPE 1: Préparer votre compte Gmail

### Option A: Utiliser un compte Gmail existant
```
1. Allez sur: https://accounts.google.com/
2. Connectez-vous avec votre compte Gmail
3. Passez à l'ÉTAPE 2
```

### Option B: Créer un compte Gmail dédié (Recommandé)
```
1. Allez sur: https://accounts.google.com/signup
2. Remplissez les informations:
   - Prénom: AfriRide
   - Nom: Support
   - Email: afriride-support@gmail.com (ou votre_nom@gmail.com)
   - Mot de passe: Un mot de passe fort (ex: AfriRide2025#Secure)
3. Suivez la vérification
```

---

## ✅ ÉTAPE 2: Générer un mot de passe d'application

**IMPORTANT:** Gmail ne permet pas d'utiliser votre mot de passe direct. Il faut générer un "mot de passe d'application".

### Étapes:

1. **Accédez à la page de gestion du compte:**
   ```
   https://myaccount.google.com/
   ```

2. **Cliquez sur "Sécurité" dans le menu de gauche**
   ```
   Sécurité → Vérification en deux étapes
   ```

3. **Activez la vérification en 2 étapes (si pas déjà activée):**
   - Cliquez sur "Vérification en deux étapes"
   - Sélectionnez votre méthode de vérification (SMS ou appel)
   - Confirmez

4. **Générez un mot de passe d'application:**
   - Retournez à https://myaccount.google.com/apppasswords
   - Sélectionnez:
     - **Sélectionner l'appli:** "Courrier"
     - **Sélectionner l'appareil:** "Windows, Mac ou Linux"
   - Cliquez "Générer"
   - Gmail générera un mot de passe de 16 caractères

5. **Copiez le mot de passe généré:**
   ```
   Exemple: abcd efgh ijkl mnop
   (sans espaces: abcdefghijklmnop)
   ```

---

## ✅ ÉTAPE 3: Configurer votre .env

Ouvrez `backend/.env` et remplissez:

```env
# EMAIL CONFIGURATION
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=afriride-support@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afriride.com
```

**Explications:**
- `EMAIL_HOST=smtp.gmail.com` → Serveur SMTP de Gmail
- `EMAIL_PORT=587` → Port standard (avec TLS)
- `EMAIL_SECURE=false` → TLS (pas SSL)
- `EMAIL_USER` → Votre adresse Gmail complète
- `EMAIL_PASSWORD` → Le mot de passe d'application (16 caractères)
- `EMAIL_FROM` → L'adresse qui apparaîtra dans "De:" des emails

---

## 🔒 SÉCURITÉ: Alternative avec Mailtrap (Pour développement)

Si vous ne voulez pas utiliser Gmail, Mailtrap est plus sûr:

### 1. Créer un compte Mailtrap:
```
https://mailtrap.io/
```

### 2. Configurez le projet:
```
- Cliquez "Create Inbox"
- Nommez-le: "AfriRide Dev"
- Cliquez sur la boîte
- Allez à "Integrations" → "Nodemailer"
```

### 3. Copiez la configuration:
Mailtrap affichera quelque chose comme:
```javascript
host: "smtp.mailtrap.io",
port: 465,
auth: {
  user: "123456",
  pass: "abcdefg123456"
}
```

### 4. Remplissez votre .env:
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=123456
EMAIL_PASSWORD=abcdefg123456
EMAIL_FROM=afriride@example.com
```

---

## 📝 GUIDE COMPLET - Gmail étape par étape

### Étape 1️⃣: Créer un compte Gmail

<img src="https://via.placeholder.com/400x300?text=Gmail+Signup" alt="Gmail Signup">

Allez sur: **https://accounts.google.com/signup**

```
Prénom: AfriRide
Nom: Support
Email: afriride-support@gmail.com
Mot de passe: Mot fort (ex: AfriRide2025#Secure)
Numéro téléphone: Votre numéro
Date de naissance: Votre date
Sexe: (choisir)
```

Cliquez "Créer un compte"

---

### Étape 2️⃣: Vérifier le compte

Gmail enverra un code de vérification à votre téléphone.
- Entrez le code reçu
- Vérifiez votre adresse e-mail
- Acceptez les conditions

---

### Étape 3️⃣: Activer la vérification en 2 étapes

1. Allez sur: **https://myaccount.google.com/security**
2. Cliquez sur "Vérification en deux étapes"
3. Sélectionnez votre téléphone
4. Vérifiez votre identité avec le code SMS reçu
5. Cliquez "Activer"

---

### Étape 4️⃣: Générer le mot de passe d'application

1. Allez sur: **https://myaccount.google.com/apppasswords**
2. Vous verrez 2 menus déroulants:
   ```
   ┌─ Sélectionner l'appli ─┐
   │ Courrier              │
   └──────────────────────┘

   ┌─ Sélectionner l'appareil ──┐
   │ Windows, Mac, Linux        │
   └────────────────────────────┘
   ```
3. Cliquez "Générer"
4. Gmail affichera: `abcd efgh ijkl mnop`
5. **Copiez ce mot de passe** (sans espaces)

---

### Étape 5️⃣: Configurer .env

Éditez `backend/.env`:

```env
# ===== EMAIL GMAIL =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=afriride-support@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afriride.com
```

---

## 🧪 TESTER LA CONFIGURATION

Une fois configuré, testez avec ce script:

### Créer `backend/test-email.js`:

```javascript
const emailService = require('./services/emailService');

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'votre_email_perso@gmail.com', // ⚠️ CHANGEZ CETTE ADRESSE!
  phone: '+221 XX XXX XXXX'
};

emailService.sendWelcomeEmail(testUser)
  .then(result => {
    console.log('✅ Email envoyé avec succès!', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });
```

### Lancer le test:
```bash
cd backend
node test-email.js
```

### Résultats attendus:
```
✅ Service email configuré
✅ Email de bienvenue envoyé: <message-id>
```

---

## 🚨 ERREURS COURANTES

### ❌ Erreur: "Invalid login: 535-5.7.8 Username and password not accepted"

**Causes possibles:**
1. ❌ Vous utilisez votre mot de passe Gmail direct (au lieu du mot de passe d'application)
2. ❌ Vous avez mal copié le mot de passe (vérifiez les espaces)
3. ❌ Vous n'avez pas activé la vérification en 2 étapes
4. ❌ Email/password ne correspondent pas

**Solution:**
- Générez un **nouveau mot de passe d'application**
- Copiez-le exactement (sans espaces)
- Redémarrez le serveur

---

### ❌ Erreur: "Authorization required"

**Cause:** La vérification en 2 étapes n'est pas activée

**Solution:**
1. Allez sur: https://myaccount.google.com/security
2. Activez "Vérification en deux étapes"
3. Puis générez le mot de passe d'application

---

### ❌ Erreur: "ENOTFOUND smtp.gmail.com"

**Cause:** Problème de connexion internet ou DNS

**Solution:**
- Testez: `ping smtp.gmail.com`
- Vérifiez votre connexion internet
- Redémarrez votre modem

---

## 📊 CONFIGURATION FINALE - RÉSUMÉ

Votre `.env` doit ressembler à:

```env
# ===== BASE DE DONNÉES =====
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afriride_db
DB_USER=postgres
DB_PASSWORD=2035

# ===== SERVEUR =====
PORT=5000
NODE_ENV=development

# ===== JWT =====
JWT_SECRET=afriride_secret_key_2025_change_this_in_production
JWT_EXPIRE=7d

# ===== EMAIL GMAIL =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=afriride-support@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afriride.com

# ===== SMS (Optionnel) =====
# TWILIO_ACCOUNT_SID=votre_sid
# TWILIO_AUTH_TOKEN=votre_token
# TWILIO_PHONE_NUMBER=+1234567890

# ===== FIREBASE (Optionnel) =====
# FIREBASE_CONFIG={"type":"service_account",...}
```

---

## ✅ VÉRIFICATION FINALE

1. **Vérifiez les variables dans .env:**
   ```bash
   cat backend/.env
   ```

2. **Redémarrez le serveur:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Vérifiez le log:**
   ```
   ✅ Service email configuré
   ```

4. **Testez l'envoi:**
   - Créez un compte utilisateur
   - Vérifiez votre boîte mail
   - Vous devriez recevoir l'email de bienvenue

---

## 🎉 C'EST BON!

Vous avez maintenant configuré le système d'email! 

Les emails seront envoyés automatiquement pour:
- ✉️ Inscription
- ✉️ Réservation
- ✉️ Paiement
- ✉️ Contrat
- ✉️ Signatures

**Questions?** 💬
