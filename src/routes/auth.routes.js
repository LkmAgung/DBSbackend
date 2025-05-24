const express = require('express');
const router = express.Router();
const { AuthController } = require('../controllers');

// Register new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

module.exports = router;