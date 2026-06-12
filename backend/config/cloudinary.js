import { v2 as cloudinary } from 'cloudinary';

let configured = false;

const ensureConfig = () => {
  if (configured) return;
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    if (match) {
      cloudinary.config({
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
      });
    }
  }
  configured = true;
};

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {object} options - { folder, resource_type, public_id, ... }
 * @returns {Promise<{ url, public_id }>}
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'museum',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  ensureConfig();
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
