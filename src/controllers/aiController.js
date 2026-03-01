/**
 * AI Controller - Handles AI-related API requests
 */
const AIService = require('../services/aiService');
const ModelLoader = require('../services/modelLoader');

class AIController {
  /**
   * Load a model endpoint
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async loadModel(req, res) {
    try {
      const { modelPath, modelName } = req.body;

      if (!modelPath) {
        return res.status(400).json({
          success: false,
          error: 'modelPath is required'
        });
      }

      await AIService.loadModel(modelPath, modelName);

      return res.json({
        success: true,
        message: `Model loaded successfully`,
        model: AIService.getModelInfo()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Make a prediction
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async predict(req, res) {
    try {
      const { input } = req.body;

      if (!input) {
        return res.status(400).json({
          success: false,
          error: 'input data is required'
        });
      }

      const result = await AIService.predict(input);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Batch prediction
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async batchPredict(req, res) {
    try {
      const { inputs } = req.body;

      if (!inputs || !Array.isArray(inputs)) {
        return res.status(400).json({
          success: false,
          error: 'inputs array is required'
        });
      }

      const result = await AIService.batchPredict(inputs);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get model info
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getModelInfo(req, res) {
    try {
      const modelInfo = AIService.getModelInfo();
      return res.json({
        success: true,
        data: modelInfo
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Unload current model
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async unloadModel(req, res) {
    try {
      AIService.unloadModel();
      return res.json({
        success: true,
        message: 'Model unloaded successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available pre-trained models
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAvailableModels(req, res) {
    try {
      const models = ModelLoader.getAvailableModels();
      return res.json({
        success: true,
        availableModels: models
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AIController();
