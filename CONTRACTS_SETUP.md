# 📋 SYSTÈME DE CONTRATS - GUIDE D'IMPLÉMENTATION

## Résumé des changements

Un système complet de gestion des contrats a été implémenté pour automatiser la création et la signature des contrats lors de la validation des paiements.

## ✅ Nouvelles fonctionnalités

### 1. **Modèle Contract** (`backend/models/Contract.js`)
Nouveau modèle qui stocke:
- Numéro de contrat unique
- Dates de début/fin de location
- Conditions générales et conditions de paiement
- Statuts de signature (client/agence)
- Lien avec la réservation et le paiement

### 2. **Création automatique de contrat**
À chaque validation de paiement réussi:
- ✅ Contrat créé automatiquement
- ✅ Lié à la réservation et au paiement
- ✅ Statut initial: `draft`

### 3. **Routes et contrôleur** 
**Backend:**
- `POST /api/contracts` - Créer un contrat
- `GET /api/contracts/:id` - Récupérer un contrat
- `GET /api/contracts/booking/:bookingId` - Lister les contrats d'une réservation
- `PUT /api/contracts/:id` - Modifier un contrat
- `POST /api/contracts/:id/sign-client` - Signature client
- `POST /api/contracts/:id/sign-agency` - Signature agence
- `DELETE /api/contracts/:id` - Supprimer un contrat

### 4. **Frontend**
- Service `contractService.js` - Gestion des appels API
- Page `ContractPage.jsx` - Affichage et signature du contrat
- Composant `BookingContracts.jsx` - Liste des contrats dans une réservation

## 📝 Flux de paiement mis à jour

```
Réservation créée
        ↓
   Paiement initié
        ↓
   Paiement validé ✓
        ↓
  Réservation confirmée (paymentStatus: 'paid')
        ↓
  🆕 CONTRAT CRÉÉ AUTOMATIQUEMENT
        ↓
  En attente de signatures (client + agence)
```

## 🔒 Niveaux d'accès

| Opération | Client | Manager | Admin |
|-----------|--------|---------|-------|
| Voir contrat | Propriétaire | Agence | Tous |
| Créer contrat | ❌ | ✅ | ✅ |
| Modifier contrat | ❌ | ✅ | ✅ |
| Signer (client) | ✅ | ❌ | ❌ |
| Signer (agence) | ❌ | ✅ | ✅ |
| Supprimer | ❌ | ✅ | ✅ |

## 📊 Champs du contrat

```javascript
{
  id: UUID,
  contractNumber: "CNT-20260113-ABC123XYZ", // Unique
  status: "draft|active|completed|cancelled|terminated",
  contractType: "rental|service|insurance",
  startDate: DATE,
  endDate: DATE,
  terms: TEXT,
  paymentTerms: TEXT,
  totalAmount: DECIMAL,
  signatureRequired: BOOLEAN,
  clientSignatureDate: DATE|NULL,
  agencySignatureDate: DATE|NULL,
  documentUrl: STRING|NULL,
  bookingId: UUID,
  paymentId: UUID|NULL,
  userId: UUID,
  agencyId: UUID
}
```

## 🚀 Utilisation

### Backend - Créer un contrat
```javascript
POST /api/contracts
{
  "bookingId": "uuid-reservation",
  "paymentId": "uuid-paiement",
  "contractType": "rental",
  "terms": "Conditions personnalisées...",
  "paymentTerms": "Conditions de paiement...",
  "signatureRequired": true,
  "notes": "Notes supplémentaires..."
}
```

### Frontend - Voir et signer un contrat
```javascript
// Charger le contrat
const contract = await contractService.getContractById(contractId);

// Signer en tant que client
await contractService.signContractAsClient(contractId);

// Signer en tant qu'agence
await contractService.signContractAsAgency(contractId);
```

## 📱 Pages créées

### 1. `ContractPage.jsx`
- Affichage complet du contrat
- Statuts de signature en temps réel
- Boutons de signature contextuels
- Lien de téléchargement du PDF (futur)

### 2. `BookingContracts.jsx` (Composant)
- Liste des contrats liés à une réservation
- Indicateurs visuels des signatures
- Liens vers les détails

## ⚙️ Intégration avec les paiements

Le contrôleur de paiement (`paymentController.js`) a été mis à jour pour:
1. Récupérer le véhicule et l'agence
2. Générer automatiquement un numéro de contrat
3. Créer le contrat après validation du paiement
4. Associer le contrat au paiement

## 🔄 États du contrat

- **draft**: Contrat en attente de signatures
- **active**: Les deux parties ont signé
- **completed**: Location terminée
- **cancelled**: Contrat annulé
- **terminated**: Contrat résilié prématurément

## 📋 Prochaines étapes (optionnel)

1. **Génération PDF**: Implémenter la génération automatique de PDF
2. **Email de notification**: Envoyer le contrat par email
3. **Signature électronique**: Intégrer une plateforme e-signature
4. **Archivage**: Système d'archivage des contrats signés

## 🐛 Débogage

Pour vérifier que les contrats sont créés:
```javascript
// Dans la console du navigateur
const contracts = await contractService.getContractsByBooking(bookingId);
console.log(contracts);
```

## 📞 Support

Pour toute question ou problème:
- Vérifier les logs du backend: `console.log` dans `paymentController.js`
- Vérifier que le modèle est synchronisé avec la base de données
- Vérifier les permissions utilisateur
