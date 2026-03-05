#!/bin/bash

# 🧪 SCRIPT DE TEST - SYSTÈME DE CONTRATS

echo "======================================"
echo "🧪 TEST DU SYSTÈME DE CONTRATS"
echo "======================================"
echo ""

# 1. Vérifier les fichiers créés
echo "✓ Vérification des fichiers..."

FILES_CREATED=(
  "backend/models/Contract.js"
  "backend/controllers/contractController.js"
  "backend/routes/contractRoutes.js"
  "frontend/src/services/contractService.js"
  "frontend/src/pages/ContractPage.jsx"
  "frontend/src/components/BookingContracts.jsx"
)

for file in "${FILES_CREATED[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MANQUANT)"
  fi
done

echo ""
echo "======================================"
echo "📝 FICHIERS MODIFIÉS"
echo "======================================"
echo ""

FILES_MODIFIED=(
  "backend/models/index.js"
  "backend/controllers/paymentController.js"
  "backend/server.js"
  "frontend/src/App.jsx"
  "frontend/src/pages/MyBookingsPage.jsx"
)

for file in "${FILES_MODIFIED[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MANQUANT)"
  fi
done

echo ""
echo "======================================"
echo "🔍 VÉRIFICATION DU CODE"
echo "======================================"
echo ""

# Vérifier l'import de Contract dans index.js
if grep -q "const Contract = require('./Contract')" backend/models/index.js; then
  echo "  ✅ Contract importé dans models/index.js"
else
  echo "  ❌ Contract NOT importé dans models/index.js"
fi

# Vérifier la création de contrat dans paymentController
if grep -q "await Contract.create" backend/controllers/paymentController.js; then
  echo "  ✅ Création automatique de contrat dans paymentController"
else
  echo "  ❌ Création de contrat NOT implémentée"
fi

# Vérifier la route
if grep -q "/api/contracts" backend/server.js; then
  echo "  ✅ Route /api/contracts enregistrée dans server.js"
else
  echo "  ❌ Route /api/contracts NOT enregistrée"
fi

# Vérifier le composant dans MyBookingsPage
if grep -q "BookingContracts" frontend/src/pages/MyBookingsPage.jsx; then
  echo "  ✅ BookingContracts importé dans MyBookingsPage"
else
  echo "  ❌ BookingContracts NOT importé"
fi

# Vérifier la route frontend
if grep -q "contracts/:id" frontend/src/App.jsx; then
  echo "  ✅ Route /contracts/:id dans App.jsx"
else
  echo "  ❌ Route /contracts/:id NOT dans App.jsx"
fi

echo ""
echo "======================================"
echo "🚀 PRÊT POUR LE TEST"
echo "======================================"
echo ""
echo "Prochaines étapes:"
echo "1. Démarrer le backend: npm start (depuis backend/)"
echo "2. Démarrer le frontend: npm run dev (depuis frontend/)"
echo "3. Créer une réservation et payer"
echo "4. Vérifier que le contrat est créé"
echo "5. Tester la signature du contrat"
echo ""
echo "======================================"
