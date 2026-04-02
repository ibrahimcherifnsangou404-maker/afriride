const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary config missing');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  configured = true;
};

const ensureLocalUploadDir = () => {
  const dir = path.join('uploads', 'messages');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const saveToLocal = async (file) => {
  const dir = ensureLocalUploadDir();
  const ext = path.extname(file.originalname || '');
  const name = `msg-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(dir, name);
  await fs.promises.writeFile(filePath, file.buffer);
  return { secure_url: `/uploads/messages/${name}`, local: true };
};

const saveVehicleToLocal = async (file) => {
  if (file?.filename) {
    return { secure_url: `/uploads/vehicles/${file.filename}`, local: true };
  }

  const dir = path.join('uploads', 'vehicles');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(file.originalname || '');
  const name = `vehicle-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(dir, name);
  await fs.promises.writeFile(filePath, file.buffer);
  return { secure_url: `/uploads/vehicles/${name}`, local: true };
};

const uploadMessageAttachment = (file) => new Promise((resolve, reject) => {
  try {
    ensureConfigured();
  } catch (err) {
    if (String(err?.message || '').includes('Cloudinary config missing')) {
      console.warn('Cloudinary non configuré, sauvegarde locale du message.');
      return saveToLocal(file).then(resolve).catch(reject);
    }
    return reject(err);
  }

  const folder = process.env.CLOUDINARY_FOLDER || 'afriride/messages';
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder,
      resource_type: 'auto'
    },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    }
  );

  uploadStream.end(file.buffer);
});

const uploadVehicleImage = (file) => new Promise((resolve, reject) => {
  try {
    ensureConfigured();
  } catch (err) {
    if (String(err?.message || '').includes('Cloudinary config missing')) {
      console.warn('Cloudinary non configurÃ©, sauvegarde locale du vehicule.');
      return saveVehicleToLocal(file).then(resolve).catch(reject);
    }
    return reject(err);
  }

  const folder = process.env.CLOUDINARY_VEHICLES_FOLDER || 'afriride/vehicles';
  cloudinary.uploader.upload(
    file.path,
    {
      folder,
      resource_type: 'image'
    },
    async (error, result) => {
      if (error) return reject(error);

      if (file.path) {
        try {
          await fs.promises.unlink(file.path);
        } catch (unlinkError) {
          console.warn('Impossible de supprimer le fichier local apres upload Cloudinary:', unlinkError.message);
        }
      }

      return resolve(result);
    }
  );
});

module.exports = {
  uploadMessageAttachment,
  uploadVehicleImage
};
