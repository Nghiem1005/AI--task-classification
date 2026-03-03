/**
 * BOW Model Routes - API endpoints for text classification using Bag-of-Words model
 */
const express = require('express');
const router = express.Router();

// Lazy load the controller to avoid loading TensorFlow at startup
let BOWPredictController;

const getController = () => {
  if (!BOWPredictController) {
    BOWPredictController = require('../controllers/bowPredictController');
  }
  return BOWPredictController;
};

// Initialize/Load the BOW model
router.post('/initialize', (req, res) => {
  getController().initializeModel(req, res);
});

// Predict single text
router.post('/predict', (req, res) => {
  getController().predictCategory(req, res);
});

// Batch predict multiple texts
router.post('/batch-predict', (req, res) => {
  getController().batchPredictCategory(req, res);
});

// Get model status
router.get('/status', (req, res) => {
  getController().getModelStatus(req, res);
});

module.exports = router;
