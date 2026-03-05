# 📍 ROUTES API - SYSTÈME DE CONTRATS

## Base URL
```
http://localhost:5000/api/contracts
```

---

## ENDPOINTS

### 1️⃣ CRÉER UN CONTRAT
```http
POST /api/contracts
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "uuid-reservation",
  "paymentId": "uuid-paiement",        // optionnel
  "contractType": "rental",             // optionnel, défaut: rental
  "terms": "Conditions personnalisées",
  "paymentTerms": "Modalités de paiement",
  "signatureRequired": true,            // optionnel, défaut: true
  "notes": "Notes additionnelles"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Contrat créé avec succès",
  "data": {
    "id": "uuid",
    "contractNumber": "CNT-20260113-ABC123",
    "status": "draft",
    "bookingId": "uuid",
    "paymentId": "uuid",
    ...
  }
}
```

**Permissions:** Manager, Admin

---

### 2️⃣ LISTER LES CONTRATS D'UNE RÉSERVATION
```http
GET /api/contracts/booking/{bookingId}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid1",
      "contractNumber": "CNT-20260113-ABC123",
      "status": "active",
      "startDate": "2026-01-15",
      "endDate": "2026-01-20",
      "totalAmount": "125000.00",
      "clientSignatureDate": "2026-01-13T10:30:00Z",
      "agencySignatureDate": "2026-01-13T10:45:00Z",
      ...
    },
    {
      "id": "uuid2",
      ...
    }
  ]
}
```

**Permissions:** Client (ses contrats), Manager (agence), Admin (tous)

---

### 3️⃣ VOIR UN CONTRAT SPÉCIFIQUE
```http
GET /api/contracts/{contractId}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contractNumber": "CNT-20260113-ABC123",
    "status": "draft",
    "contractType": "rental",
    "startDate": "2026-01-15",
    "endDate": "2026-01-20",
    "terms": "Conditions générales du contrat...",
    "paymentTerms": "Le paiement doit être effectué avant...",
    "totalAmount": "125000.00",
    "signatureRequired": true,
    "clientSignatureDate": null,
    "agencySignatureDate": null,
    "documentUrl": null,
    "notes": "Notes additionnelles...",
    "bookingId": "uuid",
    "paymentId": "uuid",
    "userId": "uuid",
    "agencyId": "uuid",
    "createdAt": "2026-01-13T10:00:00Z",
    "updatedAt": "2026-01-13T10:00:00Z",
    "booking": { ... },
    "payment": { ... },
    "user": { ... },
    "agency": { ... }
  }
}
```

**Permissions:** Client (propriétaire), Manager (agence), Admin (tous)

---

### 4️⃣ MODIFIER UN CONTRAT
```http
PUT /api/contracts/{contractId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "active",
  "terms": "Nouvelles conditions",
  "paymentTerms": "Nouvelles modalités",
  "documentUrl": "https://...",
  "clientSignatureDate": "2026-01-13T10:30:00Z",  // optionnel
  "agencySignatureDate": "2026-01-13T10:45:00Z",  // optionnel
  "notes": "Notes mises à jour"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Contrat mis à jour avec succès",
  "data": { ... }
}
```

**Permissions:** Manager, Admin

---

### 5️⃣ SIGNER LE CONTRAT (CLIENT)
```http
POST /api/contracts/{contractId}/sign-client
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Contrat signé par le client",
  "data": {
    "id": "uuid",
    "contractNumber": "CNT-20260113-ABC123",
    "status": "draft",  // ou "active" si agence a signé
    "clientSignatureDate": "2026-01-13T10:30:00Z",
    ...
  }
}
```

**Permissions:** Client (propriétaire du contrat)

---

### 6️⃣ SIGNER LE CONTRAT (AGENCE)
```http
POST /api/contracts/{contractId}/sign-agency
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Contrat signé par l'agence",
  "data": {
    "id": "uuid",
    "contractNumber": "CNT-20260113-ABC123",
    "status": "active",  // ou "draft" si client n'a pas signé
    "agencySignatureDate": "2026-01-13T10:45:00Z",
    ...
  }
}
```

**Permissions:** Manager (agence), Admin

---

### 7️⃣ SUPPRIMER UN CONTRAT
```http
DELETE /api/contracts/{contractId}
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Contrat supprimé avec succès"
}
```

**Permissions:** Manager, Admin

---

## CODES D'ERREUR

| Code | Message | Solution |
|------|---------|----------|
| **200** | OK | ✅ Succès |
| **201** | Created | ✅ Ressource créée |
| **400** | Bad Request | Vérifier les données envoyées |
| **401** | Unauthorized | Vérifier le token JWT |
| **403** | Forbidden | Pas les permissions |
| **404** | Not Found | Contrat inexistant |
| **500** | Server Error | Contacter support |

---

## EXEMPLES CURL

### Créer un contrat
```bash
curl -X POST http://localhost:5000/api/contracts \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "550e8400-e29b-41d4-a716-446655440000",
    "contractType": "rental",
    "terms": "Contrat standard de location"
  }'
```

### Lister les contrats
```bash
curl http://localhost:5000/api/contracts/booking/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGc..."
```

### Voir un contrat
```bash
curl http://localhost:5000/api/contracts/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGc..."
```

### Signer en tant que client
```bash
curl -X POST http://localhost:5000/api/contracts/550e8400-e29b-41d4-a716-446655440001/sign-client \
  -H "Authorization: Bearer eyJhbGc..."
```

### Signer en tant qu'agence
```bash
curl -X POST http://localhost:5000/api/contracts/550e8400-e29b-41d4-a716-446655440001/sign-agency \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## FLUX COMPLET D'EXEMPLE

### Étape 1: Client effectue une réservation
```bash
POST /api/bookings
{
  "vehicleId": "...",
  "startDate": "2026-01-15",
  "endDate": "2026-01-20"
}
→ bookingId créé
```

### Étape 2: Client effectue un paiement
```bash
POST /api/payments
{
  "bookingId": "550e8400-...",
  "paymentMethod": "card"
}
→ paymentId créé, status = "pending"
```

### Étape 3: Paiement validé (après 2 secondes)
```
Backend valide le paiement
Payment.status = "completed"
🆕 Contract créé automatiquement avec bookingId
```

### Étape 4: Client voit le contrat
```bash
GET /api/contracts/booking/550e8400-...
→ Récupère la liste des contrats
→ Affiche dans "Mes réservations"
```

### Étape 5: Client accède à la page du contrat
```bash
GET /api/contracts/550e8400-...
→ Affiche les conditions
→ Affiche les statuts de signature
→ Bouton "Signer le contrat"
```

### Étape 6: Client signe
```bash
POST /api/contracts/550e8400-.../sign-client
→ clientSignatureDate défini
→ En attente de signature agence
```

### Étape 7: Manager (agence) signe
```bash
POST /api/contracts/550e8400-.../sign-agency
→ agencySignatureDate défini
→ status = "active"
→ Contrat complet
```

---

## 🔐 HEADERS REQUIS

```
Authorization: Bearer {token}
Content-Type: application/json (pour POST/PUT)
```

### Obtenir un token
```bash
POST /api/auth/login
{
  "email": "client@example.com",
  "password": "password123"
}
→ Récupère le token dans la réponse
```

---

## 📊 DONNÉES DE EXEMPLE

### Réservation
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "startDate": "2026-01-15",
  "endDate": "2026-01-20",
  "totalDays": 5,
  "totalPrice": "125000.00",
  "status": "confirmed",
  "paymentStatus": "paid",
  "vehicleId": "...",
  "userId": "..."
}
```

### Contrat créé automatiquement
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "contractNumber": "CNT-1705176000123-ABCD1XYZ9",
  "status": "draft",
  "contractType": "rental",
  "startDate": "2026-01-15",
  "endDate": "2026-01-20",
  "totalAmount": "125000.00",
  "terms": "Contrat de location de Toyota Corolla...",
  "paymentTerms": "Le paiement a été effectué...",
  "signatureRequired": true,
  "clientSignatureDate": null,
  "agencySignatureDate": null,
  "bookingId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "...",
  "userId": "...",
  "agencyId": "...",
  "createdAt": "2026-01-13T10:00:02Z"
}
```

---

## ✨ NOTES

- ✅ Contrats créés **automatiquement** après validation du paiement
- ✅ Numéro de contrat **unique et séquentiel**
- ✅ Signature **bidirectionnelle** (client + agence)
- ✅ Vérification **permissions stricte**
- ✅ **Audit trail** complet avec timestamps

---

*Dernière mise à jour: 13 Janvier 2026*
