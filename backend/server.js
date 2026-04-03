const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const multer = require('multer');

// Charger les variables d'environnement (seulement en local)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const { syncDatabase } = require('./models');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://afriride-frontend.onrender.com',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
];

// ─── Sécurité HTTP Headers (Helmet) ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Autorise les images depuis le frontend
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS non autorise pour cette origine: ${origin}`));
  },
  credentials: true
}));

// ─── Limites body JSON (protection DoS) ──────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Log des requêtes en développement uniquement ─────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`🔥 ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Static files pour les uploads ───────────────────────────────────────────
// Véhicules et agences : publics
app.use('/uploads/vehicles', express.static(path.join(__dirname, 'uploads/vehicles')));
app.use('/uploads/agencies', express.static(path.join(__dirname, 'uploads/agencies')));

// Documents KYC : protégés par authentification obligatoire
const { protect } = require('./middleware/auth');
app.use('/uploads/documents', protect, express.static(path.join(__dirname, 'uploads/documents')));

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const contractRoutes = require('./routes/contractRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// ─── Route de base ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  // En production : ne pas exposer la liste des endpoints
  if (process.env.NODE_ENV === 'production') {
    return res.json({ status: 'ok', service: 'AfriRide API' });
  }
  res.json({
    message: 'API AfriRide - Serveur actif [DEV]',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      agencies: '/api/agencies',
      categories: '/api/categories',
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
      payments: '/api/payments',
      reviews: '/api/reviews',
      loyalty: '/api/loyalty',
      promoCodes: '/api/promo-codes',
      contracts: '/api/contracts',
      favorites: '/api/favorites',
      admin: '/api/admin',
      manager: '/api/manager',
      messages: '/api/messages'
    }
  });
});

// ─── Gestion des erreurs 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// ─── Gestion globale des erreurs ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Log serveur uniquement (jamais envoyé au client en prod)
  console.error('Erreur serveur:', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB par document).'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de l upload du fichier'
    });
  }

  if (err && err.message && err.message.toLowerCase().includes('type de fichier')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: 'Origine non autorisee' });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Erreur interne du serveur'
  });
});

// ─── Démarrer le serveur ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔄 Démarrage du serveur AfriRide...');
    await syncDatabase();
    initSocket(server);
    server.listen(PORT, () => {
      console.log('✅ Serveur démarré sur le port', PORT);
      console.log(`📡 API disponible sur: http://localhost:${PORT}`);
      console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
};

startServer();
