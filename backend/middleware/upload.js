const multer = require('multer');
const path = require('path');
const fs = require('fs');

// CrÃ©er les dossiers s'ils n'existent pas
const uploadDirs = ['uploads/vehicles', 'uploads/documents'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // DÃ©terminer le dossier en fonction du champ
    if (['idCardFront', 'idCardBack', 'drivingLicense'].includes(file.fieldname)) {
      cb(null, 'uploads/documents/');
    } else {
      cb(null, 'uploads/vehicles/');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'image' ? 'vehicle' : 'doc';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorise. Images (JPG, PNG, WEBP, HEIC) ou PDF uniquement.'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 5MB max par fichier
  },
  fileFilter: fileFilter
});

module.exports = upload;
