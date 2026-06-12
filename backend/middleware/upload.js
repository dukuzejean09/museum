import multer from 'multer';

// Use memory storage — files go to buffer, then uploaded to Cloudinary in controllers
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    // Video
    'video/mp4', 'video/webm', 'video/ogg',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image, audio, and video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for video support
});

export default upload;
