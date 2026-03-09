const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join('uploads', 'messages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `msg-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/aac'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorise. Image, PDF ou audio uniquement.'), false);
  }

  cb(null, true);
};

const messageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = messageUpload;
