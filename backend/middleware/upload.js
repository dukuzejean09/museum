import multer from 'multer';

// Use memory storage — files go to buffer, then uploaded to Cloudinary in controllers
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
};

const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.audio, ...ALLOWED_TYPES.video];

// File-type-specific size limits
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,  // 10MB for images
  audio: 25 * 1024 * 1024,  // 25MB for audio
  video: 50 * 1024 * 1024,  // 50MB for video
};

// Magic bytes for file type verification
const MAGIC_BYTES = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF')],
};

const getFileCategory = (mimetype) => {
  if (ALLOWED_TYPES.image.includes(mimetype)) return 'image';
  if (ALLOWED_TYPES.audio.includes(mimetype)) return 'audio';
  if (ALLOWED_TYPES.video.includes(mimetype)) return 'video';
  return null;
};

const fileFilter = (req, file, cb) => {
  if (!ALL_ALLOWED.includes(file.mimetype)) {
    return cb(new Error(`File type '${file.mimetype}' is not allowed. Accepted: images, audio, video.`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (per-type checked in middleware)
});

// Post-upload validation middleware — verifies file size per type and magic bytes
export const validateUpload = (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    for (const fieldFiles of Object.values(req.files)) {
      if (Array.isArray(fieldFiles)) files.push(...fieldFiles);
    }
  }

  for (const file of files) {
    const category = getFileCategory(file.mimetype);
    if (!category) {
      return res.status(400).json({ message: `Invalid file type: ${file.mimetype}` });
    }

    // Check per-type size limit
    const maxSize = SIZE_LIMITS[category];
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return res.status(400).json({ message: `${category} files must be under ${maxMB}MB. Got ${Math.round(file.size / 1024 / 1024)}MB.` });
    }

    // Verify magic bytes for images (prevent disguised files)
    const signatures = MAGIC_BYTES[file.mimetype];
    if (signatures && file.buffer) {
      const header = file.buffer.subarray(0, 8);
      const valid = signatures.some(sig => {
        for (let i = 0; i < sig.length; i++) {
          if (header[i] !== sig[i]) return false;
        }
        return true;
      });
      if (!valid) {
        return res.status(400).json({ message: `File content does not match its declared type (${file.mimetype}).` });
      }
    }
  }

  next();
};

export default upload;
