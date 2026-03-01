/**
 * AI Service - Handles TensorFlow model operations and predictions
 */
const tf = require('@tensorflow/tfjs-node');
const ModelLoader = require('./modelLoader');

class AIService {
  constructor() {
    this.model = null;
    this.modelName = null;
    this.isReady = false;
  }

  /**
   * Initialize and load a TensorFlow model
   * @param {string} modelPath - Path to the model (local or URL)
   * @param {string} modelName - Name identifier for the model
   * @returns {Promise<void>}
   */
  async loadModel(modelPath, modelName = 'default') {
    try {
      console.log(`Loading AI model from: ${modelPath}`);
      this.model = await ModelLoader.loadModel(modelPath);
      this.modelName = modelName;
      this.isReady = true;
      console.log(`Model '${modelName}' loaded successfully`);
    } catch (error) {
      console.error(`Failed to load model: ${error.message}`);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }

  /**
   * Make a prediction using the loaded model
   * @param {Array|Tensor} inputData - Input data for prediction
   * @returns {Promise<Object>} Prediction result
   */
  async predict(inputData) {
    if (!this.isReady || !this.model) {
      throw new Error('Model is not loaded. Please load a model first.');
    }

    try {
      // Convert input to tensor if it's an array
      let tensorInput = inputData instanceof tf.Tensor ? inputData : tf.tensor(inputData);

      // Get predictions
      const predictions = this.model.predict(tensorInput);
      
      // Convert to array for response
      const result = await predictions.data();

      // Clean up tensors
      tensorInput.dispose();
      predictions.dispose();

      return {
        success: true,
        model: this.modelName,
        predictions: Array.from(result),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Prediction error: ${error.message}`);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Batch predictions for multiple inputs
   * @param {Array<Array>} inputDataArray - Array of input data
   * @returns {Promise<Array>} Array of predictions
   */
  async batchPredict(inputDataArray) {
    if (!this.isReady || !this.model) {
      throw new Error('Model is not loaded. Please load a model first.');
    }

    try {
      const results = [];
      
      for (const inputData of inputDataArray) {
        const result = await this.predict(inputData);
        results.push(result.predictions);
      }

      return {
        success: true,
        model: this.modelName,
        batchResults: results,
        batchSize: inputDataArray.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Batch prediction error: ${error.message}`);
      throw new Error(`Batch prediction failed: ${error.message}`);
    }
  }

  /**
   * Get model summary/info
   * @returns {Object} Model information
   */
  getModelInfo() {
    if (!this.isReady || !this.model) {
      return {
        loaded: false,
        message: 'No model loaded'
      };
    }

    return {
      loaded: true,
      modelName: this.modelName,
      modelType: this.model.constructor.name,
      inputShape: this.model.inputShape,
      outputShape: this.model.outputShape,
      summary: this.model.summary ? this.model.summary() : 'Summary not available'
    };
  }

  /**
   * Unload the current model to free memory
   */
  unloadModel() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelName = null;
      this.isReady = false;
      console.log('Model unloaded');
    }
  }

  /**
   * Check if a model is currently loaded
   * @returns {boolean}
   */
  isModelLoaded() {
    return this.isReady && this.model !== null;
  }
}

module.exports = new AIService();
