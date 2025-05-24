const { upload } = require('../config/cloudinary');

// Middleware for single profile picture upload
const uploadProfilePicture = upload.single('profile_picture');

// Error handling wrapper for multer
const handleUpload = (req, res, next) => {
  uploadProfilePicture(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB.'
        });
      }
      
      if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
          success: false,
          message: 'Only image files are allowed!'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'File upload failed',
        error: error.message
      });
    }
    
    next();
  });
};

module.exports = {
  handleUpload
};