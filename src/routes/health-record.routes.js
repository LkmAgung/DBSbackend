const express = require('express');
const router = express.Router();
const { HealthRecordController } = require('../controllers');
const { authMiddleware } = require('../middlewares');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all health records for the user
router.get('/', HealthRecordController.getAllRecords);

// Get a specific health record
router.get('/:id', HealthRecordController.getRecordById);

// Create a new health record
router.post('/', HealthRecordController.createRecord);

// Update a health record
router.put('/:id', HealthRecordController.updateRecord);

// Delete a health record
router.delete('/:id', HealthRecordController.deleteRecord);

module.exports = router;