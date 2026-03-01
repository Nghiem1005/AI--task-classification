/**
 * AI Configuration
 */
module.exports = {
  // Default model settings
  defaultModel: {
    name: 'mobilenet',
    path: 'https://tfhub.dev/google/tfjs-models/mobilenet_v2/classification/3'
  },

  // Model cache settings
  modelCache: {
    enabled: true,
    maxSize: 500 // MB
  },

  // Prediction settings
  prediction: {
    batchSize: 32,
    maxInputSize: 1000,
    timeout: 30000 // milliseconds
  },

  // Supported model formats
  supportedFormats: [
    'layers_model', // TensorFlow.js Layers model
    'graph_model',  // TensorFlow.js Graph model
    'savedmodel'    // TensorFlow SavedModel format
  ],

  // Performance settings
  performance: {
    enableGPU: true,
    numThreads: 4,
    verboseLogging: true
  }
};
