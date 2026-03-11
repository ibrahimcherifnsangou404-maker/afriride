# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## ⏱️ 5 minutes pour mettre en place

### 1. Backend - Vérifier et démarrer
```bash
# Aller dans le dossier backend
cd backend

# Vérifier que tout est à jour
npm install

# Démarrer le serveur
npm start

# Vérifier dans les logs:
# ✅ "✅ Base de données synchronisée !"
# ✅ "✅ Serveur démarré sur le port 5000"
```

### 2. Frontend - Vérifier et démarrer
```bash
# Aller dans le dossier frontend
cd frontend

# Vérifier que tout est à jour
npm install

# Démarrer le développement
npm run dev

# Accéder à:
# http://localhost:5173
```

### 3. Test Rapide - Vérifier le système
```bash
# Étapes à suivre:
1. Créer un compte client (email: test@example.com)
2. Se connecter
3. Rechercher un véhicule
4. Effectuer une réservation
5. Effectuer un paiement
6. Attendre 2-3 secondes
7. Aller à "Mes réservations"
8. Vérifier "Contrats associés"
9. Cliquer "Voir le contrat"
10. Tester la signature
```

---

## 📋 Fichiers à Consulter

### 🔴 URGENT - Lire d'abord
- **RAPPORT_FINAL.md** - Résumé complet du projet
- **README_CONTRACTS.txt** - Vue visuelle ASCII

### 🟡 IMPORTANT - À lire ensuite
- **CONTRACTS_SETUP.md** - Guide d'utilisation
- **API_CONTRACTS.md** - Routes API
- **CHECKLIST.md** - Tests à faire

### 🟢 À LIRE QUAND NÉCESSAIRE
- **CONTRACTS_IMPLEMENTATION.md** - Changements détaillés
- **DEVELOPER_NOTES.md** - Notes techniques
- **INDEX_FICHIERS.md** - Index détaillé

---

## 🧪 Tester la Création Automatique du Contrat

### Via l'Interface (5 min)
```
1. Créer une réservation
   → Choix du véhicule
   → Dates (15 au 20 janvier)
   → Total: 125,000 FCFA

2. Effectuer le paiement
   → Méthode: Carte/MoMo/Cash
   → Valider le paiement

3. Vérifier le contrat
   → Aller à "Mes réservations"
   → Voir "Contrats associés"
   → Contract number: CNT-20260113-ABC123XYZ
   → Status: draft
```

### Via la Console (10 min)
```javascript
// Dans le navigateur (F12)

// Récupérer les contrats d'une réservation
const response = await fetch('/api/contracts/booking/{bookingId}', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const contracts = await response.json();
console.log(contracts.data);

// Voir un contrat spécifique
const contract = await fetch('/api/contracts/{contractId}', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await contract.json();
console.log(data.data);
```

### Via Postman (15 min)
```
1. Importer les variables d'environnement
   - base_url: http://localhost:5000
   - token: (depuis login)

2. Tester les routes:
   GET /api/contracts/booking/{bookingId}
   GET /api/contracts/{contractId}
   POST /api/contracts/{contractId}/sign-client
   POST /api/contracts/{contractId}/sign-agency
```

---

## ⚠️ Dépannage Rapide

### Contrats non créés?
```
1. Vérifier que le paiement a statut 'completed'
2. Vérifier que paymentStatus de booking = 'paid'
3. Attendre 3 secondes (délai intentionnel)
4. Vérifier les logs du backend
5. Vérifier la table contracts en base de données
```

### Erreur 403 Unauthorized?
```
1. Vérifier que vous êtes connecté
2. Vérifier que le token n'est pas expiré
3. Vérifier que vous avez les bons rôles
4. Vérifier que vous accédez à votre propre contrat
```

### Erreur 404 Not Found?
```
1. Vérifier l'ID du contrat/réservation
2. Vérifier que le contrat existe en base de données
3. Vérifier l'URL de la requête
```

### Interface pas à jour?
```
1. Forcer le rechargement: Ctrl+Shift+R
2. Vider le cache: F12 → Application → Clear Site Data
3. Relancer le frontend: npm run dev
```

---

## 📞 Besoin d'Aide?

### Erreur lors du démarrage?
→ Consulter: **CHECKLIST.md** (section "Vérification Finale")

### Problème de permissions?
→ Consulter: **API_CONTRACTS.md** (section "Permissions")

### Erreur API?
→ Consulter: **API_CONTRACTS.md** (section "Codes d'Erreur")

### Question technique?
→ Consulter: **DEVELOPER_NOTES.md**

### Tous les fichiers?
→ Consulter: **INDEX_FICHIERS.md**

---

## ✨ Prochains Pas

### Immédiat (Aujourd'hui)
- [ ] Lire RAPPORT_FINAL.md
- [ ] Démarrer backend + frontend
- [ ] Tester la création du contrat
- [ ] Tester la signature

### Court terme (Cette semaine)
- [ ] Suivre la CHECKLIST.md
- [ ] Faire tous les tests
- [ ] Corriger les bugs trouvés
- [ ] Vérifier les logs

### Moyen terme (Ce mois)
- [ ] Ajouter la génération PDF
- [ ] Ajouter l'envoi d'email
- [ ] Intégrer signature électronique

---

## 🎯 Résumé du Système

```
┌─────────────────────────────────────────┐
│  RÉSERVATION → PAIEMENT → CONTRAT      │
│                                         │
│  1. Client fait une réservation        │
│  2. Client paie                        │
│  3. 🆕 Contrat créé automatiquement    │
│  4. Client signe le contrat            │
│  5. Agence signe le contrat            │
│  6. Location peut débuter              │
└─────────────────────────────────────────┘
```

---

## 📊 Points Clés

✅ **Automatique** - Contrat créé sans action manuelle
✅ **Transparent** - Visible dans "Mes réservations"
✅ **Sécurisé** - Permissions strictes
✅ **Complet** - Conditions et signatures
✅ **Documenté** - 9 fichiers de documentation

---

## 🚀 Vous êtes prêt!

1. ✅ Code implémenté
2. ✅ Documentation fournie
3. ✅ Tests définis
4. ✅ Déploiement possible
5. ✅ Support disponible

**COMMENCEZ LE TEST MAINTENANT!** 🎉

---

*Bonne chance avec l'implémentation!*
*En cas de problème: Lire la documentation pertinente*
*Plus d'infos: Voir INDEX_FICHIERS.md*

