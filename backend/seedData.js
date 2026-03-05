const { sequelize, Agency, Category, Vehicle, User } = require('./models');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Début du seeding...');

    // Créer des catégories
    const categories = await Category.bulkCreate([
      { name: 'Économique', description: 'Véhicules abordables pour budget limité' },
      { name: 'Berline', description: 'Voitures confortables 4-5 places' },
      { name: 'SUV', description: 'Véhicules spacieux et robustes' },
      { name: 'Luxe', description: 'Voitures haut de gamme' }
    ]);

    console.log('✅ Catégories créées');

    // Créer des agences
    const agencies = await Agency.bulkCreate([
      {
        name: 'Yaounde Car Rental',
        description: 'Agence leader à Yaoundé',
        address: 'Bastos, Yaoundé',
        phone: '+237 690 00 00 01',
        email: 'contact@yaoundecar.cm'
      },
      {
        name: 'Express Location',
        description: 'Location rapide et efficace',
        address: 'Mvan, Yaoundé',
        phone: '+237 690 00 00 02',
        email: 'info@expressloc.cm'
      }
    ]);

    console.log('✅ Agences créées');

    // Créer des véhicules
    await Vehicle.bulkCreate([
      {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        licensePlate: 'YAO-001-AA',
        color: 'Blanc',
        seats: 5,
        transmission: 'automatic',
        fuelType: 'petrol',
        pricePerDay: 25000,
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
        features: ['Climatisation', 'GPS', 'Bluetooth'],
        agencyId: agencies[0].id,
        categoryId: categories[1].id
      },
      {
        brand: 'Hyundai',
        model: 'i10',
        year: 2023,
        licensePlate: 'YAO-002-BB',
        color: 'Rouge',
        seats: 4,
        transmission: 'manual',
        fuelType: 'petrol',
        pricePerDay: 15000,
        images: ['https://images.unsplash.com/photo-1580414057258-90fdb2049ce4?w=800'],
        features: ['Climatisation', 'Radio'],
        agencyId: agencies[0].id,
        categoryId: categories[0].id
      },
      {
        brand: 'Toyota',
        model: 'RAV4',
        year: 2023,
        licensePlate: 'YAO-003-CC',
        color: 'Noir',
        seats: 7,
        transmission: 'automatic',
        fuelType: 'diesel',
        pricePerDay: 45000,
        images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],
        features: ['Climatisation', 'GPS', '4x4', 'Bluetooth'],
        agencyId: agencies[1].id,
        categoryId: categories[2].id
      },
      {
        brand: 'Mercedes',
        model: 'Classe E',
        year: 2024,
        licensePlate: 'YAO-004-DD',
        color: 'Gris',
        seats: 5,
        transmission: 'automatic',
        fuelType: 'diesel',
        pricePerDay: 75000,
        images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
        features: ['Climatisation', 'GPS', 'Sièges cuir', 'Bluetooth', 'Caméra'],
        agencyId: agencies[1].id,
        categoryId: categories[3].id
      }
    ]);

    console.log('✅ Véhicules créés');
    console.log('🎉 Seeding terminé avec succès !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seeding:', error);
    process.exit(1);
  }
};

seedData();