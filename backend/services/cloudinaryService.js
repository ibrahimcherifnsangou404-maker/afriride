const cloudinary = require('cloudinary').v2;

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

const uploadMessageAttachment = (file) => new Promise((resolve, reject) => {
  try {
    ensureConfigured();
  } catch (err) {
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

module.exports = {
  uploadMessageAttachment
};
