/**
 * BOW Model Prediction Controller
 * Handles HTTP requests and delegates business logic to BOWService
 */
const BOWService = require('../services/bowService');

class BOWPredictController {
  /**
   * Initialize and load the BOW model
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async initializeModel(req, res) {
    try {
      const modelInfo = await BOWService.initialize();
      
      return res.json({
        success: true,
        message: 'BOW model loaded successfully',
        modelInfo: modelInfo
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

      // Delegate to service
      const result = BOWService.predictCategory(text);

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Prediction error:', error);
      
      // Handle model not loaded error with 503
      if (error.message.includes('not loaded')) {
        return res.status(503).json({
          success: false,
          error: error.message
        });
      }

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

      // Delegate to service
      const result = BOWService.batchPredict(texts);

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Batch prediction error:', error);

      // Handle model not loaded error with 503
      if (error.message.includes('not loaded')) {
        return res.status(503).json({
          success: false,
          error: error.message
        });
      }

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
      const modelInfo = BOWService.getModelInfo();

      return res.json({
        success: true,
        ...modelInfo
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
