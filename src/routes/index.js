// Routes index file
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const healthRecordRoutes = require('./health-record.routes');
const predictionRoutes = require('./prediction.routes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/predictions', predictionRoutes);

// Define a test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;
