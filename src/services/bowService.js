/**
 * BOW Service - Handles Bag-of-Words model operations
 * Separates business logic from HTTP layer
 */
const path = require('path');

// Label mapping
const LABEL_MAP = {
  0: { name: 'HocTap', vietnamese: 'Học Tập' },
  1: { name: 'CaNhan', vietnamese: 'Cá Nhân' },
  2: { name: 'CongViec', vietnamese: 'Công Việc' }
};

class BOWService {
  constructor() {
    this.model = null;
    this.vocab = null;
    this.isLoaded = false;
    this.trainAI = null;
  }

  /**
   * Lazy-load train-ai module
   * @private
   */
  _ensureTrainAILoaded() {
    if (!this.trainAI) {
      this.trainAI = require('../ai/training/train-ai');
    }
  }

  /**
   * Initialize and load the BOW model from disk
   * @returns {Promise<Object>} Model info (vocabSize, labelsCount, labels)
   */
  async initialize() {
    if (this.isLoaded) {
      console.log('BOW model already loaded, skipping...');
      return this.getModelInfo();
    }

    console.log('Initializing BOW model service...');

    try {
      // Ensure train-ai is loaded
      this._ensureTrainAILoaded();

      const modelDir = path.join(__dirname, '..', 'models', 'bow-model');
      console.log(`Loading BOW model from: ${modelDir}`);

      // Load model and vocabulary
      const { model, vocab } = await this.trainAI.loadModelAndVocab(modelDir);
      
      this.model = model;
      this.vocab = vocab;
      this.isLoaded = true;

      console.log('BOW model loaded successfully');
      return this.getModelInfo();
    } catch (error) {
      console.error('Error initializing BOW model:', error.message);
      throw new Error(`Failed to initialize BOW model: ${error.message}`);
    }
  }

  /**
   * Get current model information
   * @returns {Object} Model info
   */
  getModelInfo() {
    return {
      vocabSize: this.vocab ? Object.keys(this.vocab).length : 0,
      labelsCount: Object.keys(LABEL_MAP).length,
      labels: LABEL_MAP,
      isLoaded: this.isLoaded
    };
  }

  /**
   * Check if model is loaded
   * @returns {boolean} True if model is ready
   */
  isModelReady() {
    return this.isLoaded && this.model && this.vocab;
  }

  /**
   * Predict category for a single text
   * @param {string} text - Input text to classify
   * @returns {Object} Prediction result with probabilities
   * @throws {Error} If model is not loaded or prediction fails
   */
  predictCategory(text) {
    if (!this.isModelReady()) {
      throw new Error('Model not loaded. Call initialize() first');
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Input text must be a non-empty string');
    }

    try {
      // Ensure train-ai is loaded
      this._ensureTrainAILoaded();

      // Make prediction
      const probabilities = this.trainAI.predictText(text, this.model, this.vocab);
      
      // Get predicted label (highest probability)
      const probArray = Array.from(probabilities);
      const predictedLabelIndex = probArray.indexOf(Math.max(...probArray));
      const predictedLabel = LABEL_MAP[predictedLabelIndex];
      const confidenceScore = probabilities[predictedLabelIndex];

      // Build detailed results for all labels
      const allProbabilities = probArray.map((prob, idx) => ({
        labelIndex: idx,
        labelName: LABEL_MAP[idx].name,
        labelVietnamese: LABEL_MAP[idx].vietnamese,
        probability: parseFloat(prob.toFixed(4)),
        percentage: parseFloat((prob * 100).toFixed(2))
      }));

      return {
        input: text,
        prediction: {
          index: predictedLabelIndex,
          name: predictedLabel.name,
          vietnamese: predictedLabel.vietnamese,
          confidence: parseFloat(confidenceScore.toFixed(4)),
          confidencePercentage: parseFloat((confidenceScore * 100).toFixed(2))
        },
        allProbabilities: allProbabilities,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Prediction error:', error.message);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Predict categories for multiple texts
   * @param {Array<string>} texts - Array of input texts
   * @returns {Array<Object>} Array of prediction results
   * @throws {Error} If model is not loaded or inputs are invalid
   */
  batchPredict(texts) {
    if (!this.isModelReady()) {
      throw new Error('Model not loaded. Call initialize() first');
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('texts must be non-empty array');
    }

    try {
      const predictions = texts.map((text, idx) => {
        // Validate input
        if (typeof text !== 'string' || text.trim().length === 0) {
          return {
            index: idx,
            input: text,
            error: 'Input must be non-empty string'
          };
        }

        try {
          // Make prediction
          const probabilities = this.trainAI.predictText(text, this.model, this.vocab);
          const probArray = Array.from(probabilities);
          const predictedLabelIndex = probArray.indexOf(Math.max(...probArray));
          const predictedLabel = LABEL_MAP[predictedLabelIndex];
          const confidenceScore = probabilities[predictedLabelIndex];

          return {
            index: idx,
            input: text,
            prediction: {
              index: predictedLabelIndex,
              name: predictedLabel.name,
              vietnamese: predictedLabel.vietnamese,
              confidence: parseFloat(confidenceScore.toFixed(4)),
              confidencePercentage: parseFloat((confidenceScore * 100).toFixed(2))
            }
          };
        } catch (err) {
          return {
            index: idx,
            input: text,
            error: err.message
          };
        }
      });

      return {
        totalCount: texts.length,
        predictions: predictions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Batch prediction error:', error.message);
      throw new Error(`Batch prediction failed: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new BOWService();
