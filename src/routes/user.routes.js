const express = require('express');
const router = express.Router();
const { UserController } = require('../controllers');
const { authMiddleware, uploadMiddleware } = require('../middlewares');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile (name only)
router.put('/profile', UserController.updateProfile);

// Upload profile picture
router.post('/profile/picture', uploadMiddleware.handleUpload, UserController.uploadProfilePicture);

// Delete profile picture
router.delete('/profile/picture', UserController.deleteProfilePicture);

// Update password
router.put('/password', UserController.updatePassword);

module.exports = router;