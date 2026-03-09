const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors({
  origin: [
    'https://afriride-frontend.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de toutes les requêtes (Debug)
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.originalUrl}`);
  next();
});

// Static files pour les uploads
app.use('/uploads', express.static('uploads'));

// Routes
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

// Enregistrer les routes
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

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API AfriRide - Serveur actif',
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

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB par document).'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur upload: ' + err.message
    });
  }

  if (err && err.message && err.message.toLowerCase().includes('type de fichier')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔄 Démarrage du serveur AfriRide...');

    // Synchroniser la base de données
    await syncDatabase();

    // Lancer le serveur
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
