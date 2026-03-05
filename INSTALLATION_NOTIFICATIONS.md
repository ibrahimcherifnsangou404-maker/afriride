# 🚀 INSTALLATION & ACTIVATION COMPLÈTE

## ✅ ÉTAPE 1: Installer les dépendances (SI JAMAIS FAIT)

```bash
cd backend
npm install
```

Les packages suivants doivent être installés:
- ✅ `nodemailer` - Envoi d'emails
- ✅ `pdfkit` - Génération de PDF
- ✅ `twilio` - Envoi de SMS (optionnel)
- ✅ `firebase-admin` - Push notifications (optionnel)

### Vérifier installation:
```bash
npm list nodemailer pdfkit twilio firebase-admin
```

---

## ✅ ÉTAPE 2: Configurer Gmail (5 minutes)

### 2.1 Créer/Connexion Gmail
```
https://accounts.google.com/
Email: afriride-support@gmail.com (ou existant)
```

### 2.2 Activer Vérification 2FA
```
https://myaccount.google.com/security
→ Vérification en deux étapes → Activer → Confirmer par SMS
```

### 2.3 Générer Mot de Passe Application
```
https://myaccount.google.com/apppasswords
→ Courrier + Windows/Mac/Linux
→ Générer → Copier: abcd efgh ijkl mnop
```

### 2.4 Configurer .env
```bash
nano backend/.env
```

Mettre à jour:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afriride.com
```

---

## ✅ ÉTAPE 3: Tester la Configuration

### 3.1 Test Script
```bash
cd backend
node test-email.js
```

### Résultat attendu:
```
✅ Connexion réussie au serveur SMTP!
✅ Email de test envoyé avec succès!
🎉 Configuration Email est COMPLÈTE ET OPÉRATIONNELLE!
```

### 3.2 Vérifier Email Reçu
```
Vérifiez votre boîte email
Cherchez: "✅ Test Configuration Email - AfriRide"
```

---

## ✅ ÉTAPE 4: Démarrer les Serveurs

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Attendez:
```
✅ Service email configuré
✅ Connexion à PostgreSQL réussie !
✅ Base de données synchronisée !
✅ Serveur démarré sur le port 5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Attendez:
```
VITE v7.2.2  ready in 600 ms
➜  Local:   http://localhost:5173/
```

---

## ✅ ÉTAPE 5: Tests Fonctionnels

### Test 1: Inscription
```
1. Allez sur: http://localhost:5173/
2. Cliquez "S'inscrire"
3. Remplissez le formulaire:
   - Prénom: Test
   - Nom: User
   - Email: votre_email@gmail.com
   - Téléphone: +221 XX XXX XXXX
   - Mot de passe: Password123
4. Cliquez "S'inscrire"

✅ Vérifiez: Email de bienvenue reçu
```

### Test 2: Réservation
```
1. Connectez-vous
2. Allez sur "Véhicules"
3. Cliquez sur un véhicule
4. Cliquez "Réserver"
5. Sélectionnez les dates
6. Cliquez "Réserver"

✅ Vérifiez: Email de confirmation reçu
```

### Test 3: Paiement & Contrat
```
1. Allez sur "Mes réservations"
2. Cliquez "Payer" sur une réservation
3. Complétez le paiement
4. Attendez 2-3 secondes

✅ Vérifiez: Email avec PDF contrat reçu
✅ Vérifiez: Section "Contrats associés" apparu
```

### Test 4: Signatures
```
1. Cliquez "Voir le contrat"
2. Cliquez "Signer comme client"
3. Attendez quelques secondes

✅ Vérifiez: Email de notification reçu
✅ Vérifiez: Statut client = "Signé"
```

---

## 🎯 FLUX COMPLET À TESTER

```
INSCRIPTION
    ↓ Email bienvenue
CONNEXION
    ↓
RÉSERVATION
    ↓ Email confirmation + SMS
PAIEMENT
    ↓ (2 secondes)
CONTRAT CRÉÉ
    ↓ Email avec PDF
SIGNATURE CLIENT
    ↓ Email notification
SIGNATURE AGENCE
    ↓ Email "Contrat complet"
AFFICHAGE CONTRAT
    ↓ Statut = "active"
```

---

## 📊 LOGS À OBSERVER

### Dans le terminal backend:

#### Inscription:
```
✅ Email de bienvenue envoyé: <message-id>
```

#### Réservation:
```
✅ Email de réservation envoyé: <message-id>
✅ SMS de réservation envoyé: <sid>
```

#### Paiement:
```
✅ Contrat créé automatiquement pour la réservation: <id>
✅ PDF généré: /path/to/Contrat_CNT-xxx.pdf
✅ Email contrat envoyé: <message-id>
✅ SMS paiement confirmé envoyé: <sid>
```

#### Signature:
```
✅ Email de signature envoyé: <message-id>
✅ SMS signature en attente envoyé: <sid>
```

---

## ❌ DÉPANNAGE

### Erreur: "Invalid login: 535-5.7.8"
```
✅ Solution:
1. Vérifiez EMAIL_USER = Gmail complet
2. Utilisez MOT DE PASSE D'APPLICATION (pas mot de passe Gmail)
3. Vérifiez qu'aucun espace dans le mot de passe
4. Générez nouveau mot de passe app:
   https://myaccount.google.com/apppasswords
```

### Erreur: "Service email désactivé"
```
✅ Solution:
1. Les dépendances sont optionnelles
2. Si vous ne configurez pas Gmail, les emails seront logs seulement
3. Pour activer: remplissez EMAIL_USER et EMAIL_PASSWORD
```

### Email non reçu
```
✅ Vérifications:
1. Vérifiez dossier "Spam" ou "Promotions"
2. Vérifiez que l'email part du bon compte
3. Vérifiez les logs: node test-email.js
4. Vérifiez .env a été modifié correctement
5. Redémarrez le serveur backend
```

### Contrat pas créé après paiement
```
✅ Vérifications:
1. Attendez 2-3 secondes (setTimeout 2000ms)
2. Vérifiez les logs backend
3. Vérifiez que la BD est synchronisée
4. Testez avec: npm run dev
```

---

## 📋 CHECKLIST FINALE

- [ ] npm install réussi
- [ ] .env configuré (EMAIL_USER, EMAIL_PASSWORD)
- [ ] test-email.js = ✅ Réussi
- [ ] Email de test reçu
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Test inscription: Email reçu ✅
- [ ] Test réservation: Email reçu ✅
- [ ] Test paiement: Email + PDF reçu ✅
- [ ] Test signature: Email reçu ✅

---

## 🎉 C'EST BON!

Votre système de notifications est **COMPLET ET OPÉRATIONNEL!**

Vous pouvez maintenant:
✅ Envoyer des emails HTML
✅ Générer des PDF
✅ Envoyer des SMS (optionnel)
✅ Envoyer des push notifications (optionnel)
✅ Gérer les signatures de contrats

---

## 📞 SUPPORT

Pour des questions sur:
- **Email:** Voir CONFIGURATION_EMAIL.md
- **Setup rapide:** Voir EMAIL_SETUP_5MIN.md
- **Checklist:** Voir NOTIFICATIONS_CHECKLIST.md
- **Détails techniques:** Voir NOTIFICATIONS_SETUP.md

---

**Date: 13 Janvier 2026**
**Status: ✅ PRÊT POUR PRODUCTION**
