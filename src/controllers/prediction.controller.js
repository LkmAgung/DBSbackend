const PredictionModel = require('../models/prediction.model');
const HealthRecordModel = require('../models/healthRecord.model');

class PredictionController {
  async getAllPredictions(req, res) {
    try {
      const userId = req.user.userId;
      const predictions = await PredictionModel.getByUserId(userId);
      
      res.status(200).json({
        success: true,
        data: predictions
      });
    } catch (error) {
      console.error('Get predictions error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch predictions',
        error: error.message
      });
    }
  }

  async getPredictionById(req, res) {
    try {
      const predictionId = req.params.id;
      
      const prediction = await PredictionModel.getById(predictionId);
      
      if (!prediction) {
        return res.status(404).json({ 
          success: false, 
          message: 'Prediction not found' 
        });
      }
      
      // Check if prediction belongs to user
      if (prediction.user_id !== req.user.userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access to this prediction' 
        });
      }
      
      res.status(200).json({
        success: true,
        data: prediction
      });
    } catch (error) {
      console.error('Get prediction error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch prediction',
        error: error.message
      });
    }
  }

  async createPrediction(req, res) {
    try {
      const userId = req.user.userId;
      const { health_record_id } = req.body;
      
      // Get health record
      const healthRecord = await HealthRecordModel.getById(health_record_id);
      if (!healthRecord) {
        return res.status(404).json({ 
          success: false, 
          message: 'Health record not found' 
        });
      }
      
      // Check if health record belongs to user
      if (healthRecord.user_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized to use this health record' 
        });
      }
      
      // Run prediction model
      // This is where you would call your ML model API or service
      // For now, we'll simulate a prediction with a random value between 0 and 1
      const diabetesPercentage = Math.random();
      let riskStatus = 'low';
      if (diabetesPercentage > 0.7) {
        riskStatus = 'tinggi';
      } else if (diabetesPercentage > 0.4) {
        riskStatus = 'sedang';
      }
      
      // Create prediction record
      const prediction = await PredictionModel.create({
        user_id: userId,
        health_record_id,
        diabetes_percentage: diabetesPercentage * 100, // Convert to percentage
        risk_status: riskStatus,
        created_at: new Date()
      });
      
      res.status(201).json({
        success: true,
        data: prediction
      });
    } catch (error) {
      console.error('Create prediction error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create prediction',
        error: error.message
      });
    }
  }
}

module.exports = new PredictionController();