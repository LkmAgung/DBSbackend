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
    console.log('🔍 Input record:', {
      age: record.age,
      bmi: record.bmi,
      hba1c_level: record.hba1c_level,
      blood_glucose_level: record.blood_glucose_level,
      hypertension: record.hypertension,
      heart_disease: record.heart_disease,
      gender: record.gender,
      smoking_history: record.smoking_history
    });
    
    // Updated logic berdasarkan karakteristik cluster yang benar
    let clusterIndex = 1; // Default: Dewasa Sehat Rendah Risiko
    
    const age = Number(record.age);
    const bmi = Number(record.bmi);
    const hba1c = Number(record.hba1c_level);
    const glucose = Number(record.blood_glucose_level);
    const hypertension = Boolean(record.hypertension);
    const heart_disease = Boolean(record.heart_disease);
    
    console.log('🔍 Parsed values:', { age, bmi, hba1c, glucose, hypertension, heart_disease });
    
    // Cluster 2: Anak dan Remaja Sehat (usia < 18, BMI rendah)
    if (age < 18 && bmi < 25) {
      clusterIndex = 2;
      console.log('📊 Matched Cluster 2: Anak dan Remaja Sehat');
    }
    // Cluster 0: Lansia Berisiko Tinggi (usia >= 50 + faktor risiko tinggi)
    else if (age >= 50 && (
      hypertension || 
      heart_disease || 
      bmi >= 28 || 
      hba1c >= 6.0 || 
      glucose >= 150
    )) {
      clusterIndex = 0;
      console.log('📊 Matched Cluster 0: Lansia Berisiko Tinggi');
    }
    // Cluster 3: Dewasa Muda Risiko Glukosa Tinggi (usia 25-45 + glukosa/HbA1c tinggi)
    else if (age >= 25 && age <= 45 && (
      hba1c >= 5.7 || 
      glucose >= 140 || 
      record.smoking_history === 'current' ||
      record.smoking_history === 'ever'
    )) {
      clusterIndex = 3;
      console.log('📊 Matched Cluster 3: Dewasa Muda Risiko Glukosa Tinggi');
    }
    // Cluster 1: Dewasa Sehat Rendah Risiko (kondisi sehat, usia 30-60)
    else if (age >= 18 && age < 60 && 
      bmi >= 20 && bmi < 30 && 
      hba1c < 5.7 && 
      glucose < 126 && 
      !hypertension && 
      !heart_disease) {
      clusterIndex = 1;
      console.log('📊 Matched Cluster 1: Dewasa Sehat Rendah Risiko');
    }
    // Default berdasarkan usia jika tidak ada yang cocok
    else if (age < 25) {
      clusterIndex = 2; // Muda
    } else if (age >= 60) {
      clusterIndex = 0; // Lansia
    } else {
      clusterIndex = 1; // Dewasa
    }
    
    // Calculate confidence berdasarkan seberapa kuat match dengan cluster
    let confidence = 0.5; // Base confidence
    
    if (clusterIndex === 0) { // Lansia Berisiko Tinggi
      let riskFactors = 0;
      if (age >= 60) riskFactors++;
      if (hypertension) riskFactors++;
      if (heart_disease) riskFactors++;
      if (bmi >= 28) riskFactors++;
      if (hba1c >= 6.0) riskFactors++;
      if (glucose >= 150) riskFactors++;
      confidence = Math.min(0.9, 0.5 + (riskFactors * 0.1));
    } else if (clusterIndex === 1) { // Dewasa Sehat
      let healthFactors = 0;
      if (age >= 30 && age <= 55) healthFactors++;
      if (bmi >= 20 && bmi < 28) healthFactors++;
      if (hba1c < 5.7) healthFactors++;
      if (glucose < 126) healthFactors++;
      if (!hypertension) healthFactors++;
      if (!heart_disease) healthFactors++;
      confidence = Math.min(0.9, 0.5 + (healthFactors * 0.08));
    } else if (clusterIndex === 2) { // Anak Remaja
      let youthFactors = 0;
      if (age < 18) youthFactors += 2;
      if (bmi < 25) youthFactors++;
      if (!hypertension) youthFactors++;
      if (!heart_disease) youthFactors++;
      confidence = Math.min(0.9, 0.5 + (youthFactors * 0.1));
    } else if (clusterIndex === 3) { // Dewasa Muda Risiko Glukosa
      let glucoseRiskFactors = 0;
      if (age >= 25 && age <= 40) glucoseRiskFactors++;
      if (hba1c >= 5.7) glucoseRiskFactors++;
      if (glucose >= 140) glucoseRiskFactors++;
      if (record.smoking_history === 'current') glucoseRiskFactors++;
      confidence = Math.min(0.9, 0.5 + (glucoseRiskFactors * 0.12));
    }
    
    // Generate probabilities berdasarkan confidence
    const probabilities = [0.1, 0.1, 0.1, 0.1];
    probabilities[clusterIndex] = confidence;
    
    // Distribute remaining probability
    const remaining = (1 - confidence) / 3;
    for (let i = 0; i < 4; i++) {
      if (i !== clusterIndex) {
        probabilities[i] = remaining;
      }
    }
    
    console.log(`🎯 Predicted cluster: ${clusterIndex} with confidence: ${confidence.toFixed(3)}`);
    
    return {
      predicted_cluster: clusterIndex,
      confidence: confidence,
      probabilities: probabilities,
      input_processed: processedData
    };

  } catch (error) {
    console.error('❌ Prediction error:', error);
    throw error;
  }
}

// Update getModelInfo untuk cluster names yang benar
function getModelInfo() {
  const params = loadPreprocessingParams();
  
  return {
    status: 'mock_mode',
    message: 'Using rule-based predictions for testing',
    valid_genders: params.label_encoder.classes,
    valid_smoking_history: params.onehot_encoder.categories[0],
    required_features: params.numeric_features.concat(['gender', 'smoking_history']),
    clusters: {
      0: 'Lansia Berisiko Tinggi',
      1: 'Dewasa Sehat Rendah Risiko',
      2: 'Anak dan Remaja Sehat',
      3: 'Dewasa Muda Risiko Glukosa Tinggi'
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
