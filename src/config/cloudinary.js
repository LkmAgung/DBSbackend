const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diapredict/profile-pictures', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Allowed image formats
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Resize images
      { quality: 'auto:good' } // Optimize quality
    ],
    public_id: (req, file) => {
      // Generate unique filename using user ID and timestamp
      return `user-${req.user.userId}-${Date.now()}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

module.exports = { cloudinary, upload };