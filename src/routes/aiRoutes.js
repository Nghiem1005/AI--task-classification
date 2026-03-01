/**
 * AI Routes - API endpoints for AI operations
 */
const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');

// Load a model
router.post('/load-model', AIController.loadModel.bind(AIController));

// Make a prediction
router.post('/predict', AIController.predict.bind(AIController));

// Batch predictions
router.post('/batch-predict', AIController.batchPredict.bind(AIController));

// Get current model info
router.get('/model-info', AIController.getModelInfo.bind(AIController));

// Unload model
router.delete('/unload-model', AIController.unloadModel.bind(AIController));

// Get available models
router.get('/available-models', AIController.getAvailableModels.bind(AIController));

module.exports = router;
