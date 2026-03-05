const { User, Agency } = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createManager = async () => {
  try {
    console.log('🔧 Création d\'un gestionnaire...');

    // Récupérer la première agence
    const agency = await Agency.findOne();

    if (!agency) {
      console.log('❌ Aucune agence trouvée. Veuillez d\'abord exécuter seedData.js');
      process.exit(1);
    }

    // Vérifier si le gestionnaire existe déjà
    const existingManager = await User.findOne({
      where: { email: 'manager@yaoundecar.cm' }
    });

    if (existingManager) {
      console.log('⚠️  Ce gestionnaire existe déjà');
      process.exit(0);
    }

    // Créer le gestionnaire
    const manager = await User.create({
      firstName: 'Manager',
      lastName: 'Yaounde Car',
      email: 'manager@yaoundecar.cm',
      phone: '+237 690 00 00 10',
      password: 'manager123',
      role: 'manager',
      agencyId: agency.id,
      isVerified: true
    });

    console.log('✅ Gestionnaire créé avec succès !');
    console.log('📧 Email: manager@yaoundecar.cm');
    console.log('🔑 Mot de passe: manager123');
    console.log(`🏢 Agence: ${agency.name}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createManager();