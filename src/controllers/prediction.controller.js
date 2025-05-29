const PredictionModel = require('../models/prediction.model');
const HealthRecordModel = require('../models/healthRecord.model');
const { predictCluster } = require('../services/clusterPredictor');

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

      // Validate required fields for prediction
      const requiredFields = ['age', 'hypertension', 'heart_disease', 'bmi', 'hba1c_level', 'blood_glucose_level', 'gender', 'smoking_history'];
      for (const field of requiredFields) {
        if (healthRecord[field] === undefined || healthRecord[field] === null) {
          return res.status(400).json({
            success: false,
            message: `Missing required field for prediction: ${field}`
          });
        }
      }
      
      // Run cluster prediction using rule-based logic
      console.log('🔄 Running cluster prediction...');
      const predictionResult = await predictCluster(healthRecord);
      
      // Create prediction record - HANYA simpan cluster, kosongkan diabetes info
      const prediction = await PredictionModel.create({
        user_id: userId,
        health_record_id,
        diabetes_percentage: null, // Akan diisi oleh model diabetes terpisah
        risk_status: null, // Akan diisi oleh model diabetes terpisah
        cluster: getClusterName(predictionResult.predicted_cluster),
        created_at: new Date()
      });
      
      res.status(201).json({
        success: true,
        message: 'Cluster prediction created successfully',
        data: {
          ...prediction,
          cluster_info: {
            predicted_cluster: predictionResult.predicted_cluster,
            confidence: predictionResult.confidence,
            cluster_name: getClusterName(predictionResult.predicted_cluster),
            cluster_description: getClusterDescription(predictionResult.predicted_cluster),
            risk_score: predictionResult.risk_score
          }
        }
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

  // Enhanced direct cluster prediction
  async predictClusterDirect(req, res) {
    try {
      const inputData = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'hypertension', 'heart_disease', 'bmi', 'hba1c_level', 'blood_glucose_level', 'gender', 'smoking_history'];
      for (const field of requiredFields) {
        if (inputData[field] === undefined || inputData[field] === null) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`
          });
        }
      }
      
      console.log('🔍 Direct cluster prediction for data:', inputData);
      
      // Run prediction
      const result = await predictCluster(inputData);
      
      res.json({
        success: true,
        message: 'Cluster prediction successful',
        data: {
          predicted_cluster: result.predicted_cluster,
          cluster_name: getClusterName(result.predicted_cluster),
          cluster_description: getClusterDescription(result.predicted_cluster),
          confidence: result.confidence,
          probabilities: result.probabilities,
          risk_score: result.risk_score,
          note: "Untuk prediksi diabetes, gunakan model terpisah"
        }
      });

    } catch (error) {
      console.error('❌ Direct cluster prediction error:', error);
      res.status(500).json({
        success: false,
        message: 'Cluster prediction failed',
        error: error.message
      });
    }
  }

  // Health check untuk prediction service
  async healthCheck(req, res) {
    try {
      const { getModelInfo } = require('../services/clusterPredictor');
      const modelInfo = getModelInfo();
      
      res.json({
        success: true,
        message: 'Cluster prediction service is running',
        timestamp: new Date().toISOString(),
        model_status: 'mock_mode',
        model_info: modelInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Prediction service health check failed',
        error: error.message
      });
    }
  }
}

// Updated Helper function untuk nama cluster berdasarkan analisis
function getClusterName(clusterIndex) {
  const clusterNames = {
    0: 'Lansia Berisiko Tinggi',
    1: 'Dewasa Sehat Rendah Risiko',
    2: 'Anak dan Remaja Sehat',
    3: 'Dewasa Muda Risiko Glukosa Tinggi'
  };
  
  return clusterNames[clusterIndex] || `Cluster ${clusterIndex}`;
}

// New Helper function untuk deskripsi cluster
function getClusterDescription(clusterIndex) {
  const clusterDescriptions = {
    0: 'Individu lansia (rata-rata usia 60 tahun) dengan prevalensi hipertensi dan penyakit jantung yang cukup tinggi. BMI mendekati obesitas dengan HbA1c dan glukosa darah tinggi, mengindikasikan risiko diabetes dan komplikasi metabolik.',
    1: 'Individu dewasa (rata-rata 48 tahun) dengan kondisi metabolik yang sangat sehat. BMI normal, HbA1c dan glukosa darah rendah, prevalensi hipertensi dan penyakit jantung sangat rendah.',
    2: 'Populasi anak-anak dan remaja (rata-rata usia 11 tahun) dengan BMI terendah dan hampir nol kasus hipertensi atau penyakit jantung. Mencerminkan kelompok dengan risiko metabolik terendah.',
    3: 'Dewasa muda (rata-rata usia 32.8 tahun) dengan HbA1c dan glukosa darah tinggi meskipun prevalensi hipertensi dan penyakit jantung rendah. BMI pada batas atas normal dengan risiko prediabetes.'
  };
  
  return clusterDescriptions[clusterIndex] || `Deskripsi untuk cluster ${clusterIndex} tidak tersedia`;
}

module.exports = new PredictionController();