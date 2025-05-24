const express = require('express');
const router = express.Router();
const { UserController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put('/profile', UserController.updateProfile);

// Update password
router.put('/password', UserController.updatePassword);

module.exports = router;