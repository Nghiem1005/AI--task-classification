/**
 * BOW Model Prediction Controller
 * Handles text classification using the Bag-of-Words model
 */
const path = require('path');
const fs = require('fs');

// Label mapping
const LABEL_MAP = {
  0: { name: 'HocTap', vietnamese: 'Học Tập' },
  1: { name: 'CaNhan', vietnamese: 'Cá Nhân' },
  2: { name: 'CongViec', vietnamese: 'Công Việc' }
};

class BOWPredictController {
  constructor() {
    this.model = null;
    this.vocab = null;
    this.isModelLoaded = false;
    this.loadModelAndVocab = null;
    this.predictText = null;
  }

  /**
   * Lazy-load the train-ai module
   */
  async _ensureTrainAILoaded() {
    if (!this.loadModelAndVocab) {
      const trainAI = require('../ai/training/train-ai');
      this.loadModelAndVocab = trainAI.loadModelAndVocab;
      this.predictText = trainAI.predictText;
    }
  }

  /**
   * Initialize and load the BOW model
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async initializeModel(req, res) {
    try {
      if (this.isModelLoaded) {
        return res.json({
          success: true,
          message: 'BOW model already loaded',
          modelInfo: {
            vocabSize: Object.keys(this.vocab).length,
            labelsCount: Object.keys(LABEL_MAP).length,
            labels: LABEL_MAP
          }
        });
      }

      const modelDir = path.join(__dirname, '..', 'models', 'bow-model');
      console.log(`Loading BOW model from: ${modelDir}`);

      // Ensure train-ai module is loaded
      await this._ensureTrainAILoaded();

      const { model, vocab } = await this.loadModelAndVocab(modelDir);
      this.model = model;
      this.vocab = vocab;
      this.isModelLoaded = true;

      return res.json({
        success: true,
        message: 'BOW model loaded successfully',
        modelInfo: {
          vocabSize: Object.keys(vocab).length,
          labelsCount: Object.keys(LABEL_MAP).length,
          labels: LABEL_MAP
        }
      });
    } catch (error) {
      console.error('Error loading model:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Predict text category using BOW model
   * @param {Object} req - Request object with { text: string }
   * @param {Object} res - Response object
   */
  async predictCategory(req, res) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'text field is required and must be a string'
        });
      }

      if (!this.isModelLoaded) {
        return res.status(503).json({
          success: false,
          error: 'Model not loaded. Call /api/bow/initialize first'
        });
      }

      // Make prediction
      const probabilities = this.predictText(text, this.model, this.vocab);
      
      // Get predicted label (highest probability)
      const predictedLabelIndex = Array.from(probabilities).indexOf(
        Math.max(...Array.from(probabilities))
      );

      const predictedLabel = LABEL_MAP[predictedLabelIndex];
      const confidenceScore = probabilities[predictedLabelIndex];

      // Prepare detailed results
      const detailedResults = Array.from(probabilities).map((prob, idx) => ({
        labelIndex: idx,
        labelName: LABEL_MAP[idx].name,
        labelVietnamese: LABEL_MAP[idx].vietnamese,
        probability: parseFloat(prob.toFixed(4)),
        percentage: parseFloat((prob * 100).toFixed(2))
      }));

      return res.json({
        success: true,
        input: text,
        prediction: {
          index: predictedLabelIndex,
          name: predictedLabel.name,
          vietnamese: predictedLabel.vietnamese,
          confidence: confidenceScore,
          confidencePercentage: parseFloat((confidenceScore * 100).toFixed(2))
        },
        allProbabilities: detailedResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Prediction error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Batch predict multiple texts
   * @param {Object} req - Request object with { texts: Array<string> }
   * @param {Object} res - Response object
   */
  async batchPredictCategory(req, res) {
    try {
      const { texts } = req.body;

      if (!texts || !Array.isArray(texts)) {
        return res.status(400).json({
          success: false,
          error: 'texts field is required and must be an array'
        });
      }

      if (texts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'texts array cannot be empty'
        });
      }

      if (!this.isModelLoaded) {
        return res.status(503).json({
          success: false,
          error: 'Model not loaded. Call /api/bow/initialize first'
        });
      }

      // Predict for each text
      const predictions = texts.map((text, idx) => {
        if (typeof text !== 'string') {
          return {
            index: idx,
            input: text,
            error: 'Input must be string'
          };
        }

        const probabilities = this.predictText(text, this.model, this.vocab);
        const predictedLabelIndex = Array.from(probabilities).indexOf(
          Math.max(...Array.from(probabilities))
        );

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
      });

      return res.json({
        success: true,
        totalCount: texts.length,
        predictions: predictions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Batch prediction error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get model status and information
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getModelStatus(req, res) {
    try {
      if (!this.isModelLoaded) {
        return res.json({
          success: true,
          isLoaded: false,
          message: 'Model not loaded'
        });
      }

      return res.json({
        success: true,
        isLoaded: true,
        vocabSize: Object.keys(this.vocab).length,
        labelsCount: Object.keys(LABEL_MAP).length,
        labels: LABEL_MAP
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BOWPredictController();
