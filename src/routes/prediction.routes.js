const express = require('express');
const router = express.Router();
const { PredictionController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all predictions for the user
router.get('/', PredictionController.getAllPredictions);

// Get a specific prediction
router.get('/:id', PredictionController.getPredictionById);

// Create a new prediction
router.post('/', PredictionController.createPrediction);

module.exports = router;