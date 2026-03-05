# 🔐 GUIDE COMPLET - CONFIGURER GMAIL POUR AFRIRIDE

> **Erreur actuellement:** "Invalid login: 535-5.7.8 Username and Password not accepted"
> Cette erreur signifie que vos identifiants Gmail ne sont pas corrects dans .env

---

## 📋 CHECKLIST AVANT COMMENCER

- ✅ Un compte Gmail personnel ou professionnel
- ✅ Accès à Gmail sur navigateur
- ✅ 5 minutes disponibles
- ✅ VS Code ouvert avec le projet

---

## 🎯 MÉTHODE 1: UTILISER UN MOT DE PASSE D'APPLICATION (RECOMMANDÉ)

### Étape 1: Ouvrir votre compte Google

1. Allez à: https://accounts.google.com
2. **Se connecter** avec votre email Gmail

```
Email: votre_email@gmail.com
Mot de passe: votre_mot_de_passe_gmail
```

✅ Vous êtes maintenant connecté

---

### Étape 2: Activer la vérification en deux étapes (2FA)

**Pourquoi?** Google vous oblige à avoir 2FA pour créer un mot de passe d'application.

1. Allez à: https://myaccount.google.com/security

2. Cherchez la section: **"Comment vous vous connectez à Google"**

3. Cliquez sur: **"Vérification en deux étapes"** (ou **2-Step Verification**)

```
Si vous voyez "Désactivée" → Cliquez dessus
```

4. Cliquez sur: **"Commencer"** (ou **Get Started**)

5. Choisissez une méthode (SMS ou Application):
   - **SMS** (Recommandé si vous avez un téléphone): 
     - Entrez votre numéro de téléphone
     - Entrez le code que vous recevez par SMS
   
   - **Application d'authentification** (Authenticator):
     - Téléchargez Google Authenticator
     - Scannez le QR code
     - Entrez le code de 6 chiffres

6. Cliquez: **"Activer"** ou **"Enable"**

✅ Vérification 2FA activée!

---

### Étape 3: Générer un mot de passe d'application

Maintenant que vous avez 2FA:

1. Retournez à: https://myaccount.google.com/security

2. Cherchez: **"Mots de passe des applications"** ou **"App passwords"**

   > **Si vous ne le voyez pas:**
   > - Vérifiez que 2FA est vraiment activée
   > - Attendez quelques minutes et rechargez la page
   > - Essayez dans un navigateur incognito

3. Cliquez sur: **"Mots de passe des applications"**

4. Sélectionnez:
   - **Appareil:** `Windows / Mac / Linux`
   - **Application:** `Courrier`

5. Google affichera un mot de passe à 16 caractères:

```
abcd efgh ijkl mnop
```

6. **Copier ce mot de passe** (sans les espaces)

```
abcdefghijklmnop
```

✅ Mot de passe généré!

---

### Étape 4: Configurer le fichier .env

Maintenant mettez à jour votre fichier `backend/.env`:

1. **Ouvrez** VS Code
2. **Allez à**: `backend/.env`
3. **Trouvez** la section `EMAIL GMAIL`
4. **Remplacez:**

```bash
# ❌ AVANT (placeholders)
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app

# ✅ APRÈS (vos vrais identifiants)
EMAIL_USER=monsuperemail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Exemple réel:**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=afriride.support@gmail.com
EMAIL_PASSWORD=kxyz abcd efgh ijkl
EMAIL_FROM=noreply@afriride.com
```

5. **Sauvegarder** le fichier (Ctrl+S)

✅ Configuration faite!

---

## 🧪 ÉTAPE 5: TESTER VOTRE CONFIGURATION

Ouvrez un terminal dans VS Code:

```bash
# Naviguez au dossier backend
cd backend

# Lancez le test
node test-email.js
```

### Résultats attendus

**✅ Si ça fonctionne:**
```
✅ Variables d'environnement valides
✅ Connexion SMTP réussie
✅ Email de test envoyé avec succès
📧 ID du message: <xxxx@gmail.com>

Vérifiez votre boîte Gmail pour le test email!
```

**❌ Si ça échoue:**
Voir la section **Troubleshooting** ci-dessous

---

## 🔍 VÉRIFIER QUE L'EMAIL EST REÇU

1. Ouvrez Gmail: https://mail.google.com

2. Cherchez un email avec:
   - **De:** noreply@afriride.com
   - **Sujet:** ✅ Test Configuration Email

3. **Si vous le voyez en SPAM:**
   - Ouvrez l'email
   - Cliquez: **"Ce n'est pas du courrier indésirable"**
   - Gmail apprendra que c'est légitime

✅ Configuration terminée!

---

## ⚙️ CONFIGURATION COMPLÈTE (Copier-Coller)

Si vous avez généré un mot de passe: `abcd efgh ijkl mnop`

Votre .env devrait avoir:

```env
# ===== EMAIL GMAIL =====
# Instructions: Voir GMAIL_CONFIGURATION_GUIDE.md
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afriride.com
```

---

## 🆘 TROUBLESHOOTING

### Erreur 1: "Username and Password not accepted" (535-5.7.8)

**Causes possibles:**

1. **❌ Vous avez oublié de mettre le mot de passe sans espaces:**
   ```
   ❌ FAUX: EMAIL_PASSWORD=abcd efgh ijkl mnop
   ✅ BON:  EMAIL_PASSWORD=abcdefghijklmnop
   ```

2. **❌ Le 2FA n'est pas activé:**
   - Google bloque les anciens mots de passe sans 2FA
   - Solution: Activez 2FA d'abord, puis générez un mot de passe d'application

3. **❌ Vous avez utilisé votre mot de passe Gmail normal:**
   - Solution: Utilisez UNIQUEMENT le mot de passe d'application (16 caractères)

4. **❌ Le mot de passe a changé:**
   - Solution: Régénérez-le sur https://myaccount.google.com/apppasswords

**Solutions:**

```bash
# 1. Vérifier que .env est sauvegardé
# 2. Redémarrer le serveur backend
npm run dev

# 3. Relancer le test
node test-email.js
```

---

### Erreur 2: "Gmail timeout"

**Cause:** Problème de connexion réseau

**Solutions:**
```bash
# 1. Vérifier votre connexion internet
ping smtp.gmail.com

# 2. Essayer avec une autre connexion WiFi
# 3. Vérifier que le port 587 est ouvert (très rare)
```

---

### Erreur 3: "Module not found: nodemailer"

**Cause:** Dépendance manquante

**Solution:**
```bash
cd backend
npm install nodemailer
npm run dev
```

---

### Erreur 4: Email envoyé mais pas reçu

**Cause:** Probablement en SPAM

**Solutions:**
1. Ouvrez Gmail
2. Cherchez dans l'onglet **SPAM** ou **Promotions**
3. Si vous le trouvez:
   - Ouvrez-le
   - Cliquez: **"Ce n'est pas du courrier indésirable"**
4. Gmail apprendra à livrer à la boîte de réception

---

## 📱 ALTERNATIVE: UTILISER MAILTRAP (Pour développement)

Si vous ne voulez pas utiliser Gmail:

1. Créez un compte gratuit: https://mailtrap.io
2. Créez une "Inbox"
3. Copiez les identifiants SMTP
4. Remplacez dans .env:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=votre_user_mailtrap
EMAIL_PASSWORD=votre_pass_mailtrap
EMAIL_FROM=noreply@afriride.com
```

5. Testez: `node test-email.js`

---

## ✅ RÉSUMÉ DES ÉTAPES

| Étape | Action | Temps |
|-------|--------|-------|
| 1 | Se connecter à Google | 30s |
| 2 | Activer 2FA | 2 min |
| 3 | Générer mot de passe app | 1 min |
| 4 | Configurer .env | 1 min |
| 5 | Tester | 30s |
| **TOTAL** | | **5 min** |

---

## 🎓 POINTS IMPORTANTS

✅ **DO's**
- ✓ Utilisez un mot de passe d'APPLICATION (16 chars)
- ✓ Activez 2FA sur votre compte Gmail
- ✓ Vérifiez que 2FA fonctionne avant de générer le mot de passe app
- ✓ Copiez le mot de passe SANS les espaces
- ✓ Redémarrez le serveur après modifier .env
- ✓ Vérifiez en SPAM si l'email ne arrive pas

❌ **DON'Ts**
- ✗ N'utilisez pas votre mot de passe Gmail normal
- ✗ Ne pushez pas votre .env en git
- ✗ Ne désactivez pas 2FA (Gmail rejettera les connexions)
- ✗ Ne partez pas votre mot de passe d'app à d'autres

---

## 🔐 SÉCURITÉ

### Bonnes pratiques

1. **Mot de passe d'application unique:**
   - Ce mot de passe est UNIQUEMENT pour AfriRide
   - Il ne peut pas accéder à votre compte Gmail
   - Si vous pensez qu'il est compromis, supprimez-le simplement

2. **Ne pas committer .env:**
   ```bash
   # Vérifiez que .env est dans .gitignore
   echo "backend/.env" >> .gitignore
   ```

3. **Changer régulièrement:**
   - En production, changez le mot de passe tous les 6 mois
   - Régénérez simplement sur https://myaccount.google.com/apppasswords

4. **Monitoring:**
   - Allez à https://myaccount.google.com/security
   - Vérifiez **"Activité de votre compte"**
   - Si vous voyez des locations suspectes, changez le mot de passe

---

## 📞 BESOIN D'AIDE?

### Vérification rapide

```bash
# 1. Vérifiez que .env est correct
cat backend/.env | grep EMAIL

# 2. Testez la connexion
node backend/test-email.js

# 3. Vérifiez les logs
npm run dev | grep -i email
```

### Liens utiles

- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Google 2-Step Verification](https://support.google.com/accounts/answer/180744)
- [Nodemailer Gmail Setup](https://nodemailer.com/smtp/gmail/)

---

**Dernière mise à jour:** 13 Janvier 2026
**Status:** ✅ TESTÉ ET VALIDÉ
