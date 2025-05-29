const express = require('express');
const router = express.Router();
const { PredictionController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

// Health check (no auth required)
router.get('/health', PredictionController.healthCheck);

// Apply auth middleware to protected routes
router.use(authMiddleware);

// Get all predictions for the user
router.get('/', PredictionController.getAllPredictions);

// Get a specific prediction
router.get('/:id', PredictionController.getPredictionById);

// Create a new prediction
router.post('/', PredictionController.createPrediction);

// Direct cluster prediction without saving to DB
router.post('/predict-cluster', PredictionController.predictClusterDirect);

module.exports = router;