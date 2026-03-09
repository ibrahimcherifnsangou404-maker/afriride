const { Sequelize } = require('sequelize');

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'TROUVÉE ✅' : 'MANQUANTE ❌');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    );

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à PostgreSQL réussie !');
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error.message);
  }
};

module.exports = { sequelize, testConnection };