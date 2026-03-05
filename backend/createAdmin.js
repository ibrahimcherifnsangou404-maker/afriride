const { User } = require('./models');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('🔧 Création d\'un administrateur...');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: 'admin@afriride.cm' }
    });

    if (existingAdmin) {
      console.log('⚠️  Cet administrateur existe déjà');
      process.exit(0);
    }

    // Créer l'administrateur
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'AfriRide',
      email: 'admin@afriride.cm',
      phone: '+237 690 00 00 99',
      password: 'admin123',
      role: 'admin',
      agencyId: null,
      isVerified: true
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email: admin@afriride.cm');
    console.log('🔑 Mot de passe: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createAdmin();