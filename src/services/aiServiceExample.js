/**
 * Example AI Service Usage
 * 
 * This file demonstrates how to use the AI service for model loading and predictions
 */

const AIService = require('../services/aiService');

// Example 1: Load a model from a URL
async function exampleLoadModel() {
  try {
    // Load MobileNet model from TensorFlow Hub
    await AIService.loadModel(
      'https://tfhub.dev/google/tfjs-models/mobilenet_v2/classification/3',
      'mobilenet-v2'
    );
    
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error.message);
  }
}

// Example 2: Make a prediction
async function examplePredict() {
  try {
    // Make sure a model is loaded first
    if (!AIService.isModelLoaded()) {
      await exampleLoadModel();
    }

    // Create sample input data
    const inputData = [[1, 2, 3, 4, 5]]; // Example input

    const result = await AIService.predict(inputData);
    console.log('Prediction result:', result);
  } catch (error) {
    console.error('Error making prediction:', error.message);
  }
}

// Example 3: Batch predictions
async function exampleBatchPredict() {
  try {
    if (!AIService.isModelLoaded()) {
      await exampleLoadModel();
    }

    // Multiple input samples
    const inputDataArray = [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
      [3, 4, 5, 6, 7]
    ];

    const result = await AIService.batchPredict(inputDataArray);
    console.log('Batch prediction result:', result);
  } catch (error) {
    console.error('Error in batch prediction:', error.message);
  }
}

// Example 4: Get model info
function exampleGetModelInfo() {
  const modelInfo = AIService.getModelInfo();
  console.log('Model Info:', modelInfo);
}

// Export examples
module.exports = {
  exampleLoadModel,
  examplePredict,
  exampleBatchPredict,
  exampleGetModelInfo
};
