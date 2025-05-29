// Temporary implementation without TensorFlow.js for testing
const path = require('path');
const fs = require('fs');

let preprocessingParams;

// Load preprocessing parameters
function loadPreprocessingParams() {
  if (!preprocessingParams) {
    try {
      const paramsPath = path.join(__dirname, '../config/preprocessing_params.json');
      const paramsData = fs.readFileSync(paramsPath, 'utf8');
      preprocessingParams = JSON.parse(paramsData);
      console.log('✅ Preprocessing parameters loaded successfully');
    } catch (error) {
      console.error('❌ Error loading preprocessing parameters:', error);
      // Fallback parameters jika file tidak ada
      preprocessingParams = {
        "scaler": {
          "mean": [54.47, 0.075, 0.04, 27.32, 5.53, 138.06],
          "scale": [22.52, 0.26, 0.19, 6.95, 1.07, 40.71]
        },
        "label_encoder": {
          "classes": ["Female", "Male"]
        },
        "onehot_encoder": {
          "categories": [["No Info", "current", "ever", "former", "never", "not current"]]
        },
        "numeric_features": ["age", "hypertension", "heart_disease", "bmi", "HbA1c_level", "blood_glucose_level"]
      };
    }
  }
  return preprocessingParams;
}

// Label Encoding untuk Gender (Female=0, Male=1)
function labelEncode(value, classes) {
  const index = classes.indexOf(value);
  return index !== -1 ? index : 0;
}

// One-Hot Encoding untuk Smoking History
function oneHotEncode(value, categories) {
  return categories.map(cat => (cat === value ? 1 : 0));
}

// Standard Scaling: (value - mean) / scale
function standardScale(values, means, scales) {
  return values.map((value, index) => (value - means[index]) / scales[index]);
}

function preprocessInput(record) {
  try {
    const params = loadPreprocessingParams();
    
    // 1. Extract dan scale numeric features sesuai tutorial
    const numericValues = params.numeric_features.map(feature => {
      // Mapping nama field yang mungkin berbeda
      const fieldMapping = {
        'HbA1c_level': 'hba1c_level',
        'blood_glucose_level': 'blood_glucose_level'
      };
      
      const fieldName = fieldMapping[feature] || feature;
      return record[fieldName] || 0;
    });
    
    const scaledNumeric = standardScale(
      numericValues, 
      params.scaler.mean, 
      params.scaler.scale
    );

    // 2. Label encode gender
    const genderEncoded = labelEncode(
      record.gender, 
      params.label_encoder.classes
    );

    // 3. One-hot encode smoking_history
    const smokingEncoded = oneHotEncode(
      record.smoking_history,
      params.onehot_encoder.categories[0]
    );

    // 4. Gabungkan semua features sesuai urutan training (total 13 fitur)
    const features = [
      ...scaledNumeric,  // 6 fitur numerik (scaled)
      genderEncoded,     // 1 fitur gender (label encoded)
      ...smokingEncoded  // 6 fitur smoking (one-hot encoded)
    ];

    console.log(`📊 Processed features count: ${features.length}`);
    return features;

  } catch (error) {
    console.error('❌ Preprocessing error:', error);
    throw error;
  }
}

function validateInput(data, params) {
  const required = ['age', 'hypertension', 'heart_disease', 'bmi', 'hba1c_level', 'blood_glucose_level', 'gender', 'smoking_history'];
  
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validasi gender
  if (!params.label_encoder.classes.includes(data.gender)) {
    throw new Error(`Invalid gender. Must be one of: ${params.label_encoder.classes.join(', ')}`);
  }

  // Validasi smoking_history
  if (!params.onehot_encoder.categories[0].includes(data.smoking_history)) {
    throw new Error(`Invalid smoking_history. Must be one of: ${params.onehot_encoder.categories[0].join(', ')}`);
  }

  // Validasi numeric values
  const numerics = ['age', 'hypertension', 'heart_disease', 'bmi', 'hba1c_level', 'blood_glucose_level'];
  for (const field of numerics) {
    if (isNaN(Number(data[field]))) {
      throw new Error(`${field} must be a valid number`);
    }
  }
}

async function predictCluster(record) {
  try {
    const params = loadPreprocessingParams();
    
    // Validasi input
    validateInput(record, params);
    
    // Preprocessing input
    const processedData = preprocessInput(record);
    
    console.log('🔍 Processed data:', processedData);
    
    // Mock prediction berdasarkan logic sederhana untuk testing
    let clusterIndex = 0;
    
    // Simple rule-based clustering untuk testing
    const age = record.age;
    const bmi = record.bmi;
    const hba1c = record.hba1c_level;
    const glucose = record.blood_glucose_level;
    
    // Hitung risk score berdasarkan thresholds
    let riskScore = 0;
    
    if (age > 45) riskScore += 1;
    if (bmi > 25) riskScore += 1;
    if (hba1c > 6.5) riskScore += 2;
    if (glucose > 126) riskScore += 2;
    if (record.hypertension) riskScore += 1;
    if (record.heart_disease) riskScore += 2;
    if (record.smoking_history === 'current') riskScore += 1;
    
    // Mapping risk score ke cluster
    if (riskScore <= 2) clusterIndex = 0; // Low risk
    else if (riskScore <= 4) clusterIndex = 1; // Moderate risk
    else if (riskScore <= 6) clusterIndex = 2; // High risk
    else clusterIndex = 3; // Critical risk
    
    // Generate mock probabilities
    const probabilities = [0.25, 0.25, 0.25, 0.25];
    probabilities[clusterIndex] = 0.7; // High confidence for predicted cluster
    
    // Normalize probabilities
    const sum = probabilities.reduce((a, b) => a + b, 0);
    const normalizedProbs = probabilities.map(p => p / sum);
    
    const confidence = normalizedProbs[clusterIndex];
    
    console.log(`🎯 Predicted cluster: ${clusterIndex} with confidence: ${confidence.toFixed(3)}`);
    
    return {
      predicted_cluster: clusterIndex,
      confidence: confidence,
      probabilities: normalizedProbs,
      input_processed: processedData,
      risk_score: riskScore
    };

  } catch (error) {
    console.error('❌ Prediction error:', error);
    throw error;
  }
}

// Function untuk mendapatkan info model
function getModelInfo() {
  const params = loadPreprocessingParams();
  
  return {
    status: 'mock_mode',
    message: 'Using rule-based predictions for testing',
    valid_genders: params.label_encoder.classes,
    valid_smoking_history: params.onehot_encoder.categories[0],
    required_features: params.numeric_features.concat(['gender', 'smoking_history']),
    clusters: {
      0: 'Low Risk Profile',
      1: 'Moderate Risk Profile',
      2: 'High Risk Profile',
      3: 'Critical Risk Profile'
    },
    preprocessing_features: 13
  };
}

// Cleanup function
function cleanup() {
  console.log('🧹 Cleanup completed (mock mode)');
}

module.exports = { 
  predictCluster,
  getModelInfo,
  cleanup
};
