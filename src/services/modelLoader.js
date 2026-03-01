/**
 * Model Loader - Handles loading TensorFlow models from various sources
 */
const tf = require('@tensorflow/tfjs');

class ModelLoader {
  /**
   * Load a TensorFlow model from local filesystem or URL
   * @param {string} modelPath - Path or URL to the model
   * @returns {Promise<tf.LayersModel>} Loaded model
   */
  async loadModel(modelPath) {
    try {
      // Support both local paths and URLs
      let modelUrl = modelPath;
      
      // If it's a local path, convert to file:// URL
      if (!modelPath.startsWith('http') && !modelPath.startsWith('file://')) {
        modelUrl = `file://${modelPath}`;
      }

      // Load the model using TensorFlow.js
      const model = await tf.loadLayersModel(modelUrl);
      return model;
    } catch (error) {
      throw new Error(`Failed to load model from ${modelPath}: ${error.message}`);
    }
  }

  /**
   * Load a SavedModel format (more flexible)
   * @param {string} modelPath - Path to SavedModel directory
   * @returns {Promise<tf.GraphModel>} Loaded graph model
   */
  async loadGraphModel(modelPath) {
    try {
      const model = await tf.loadGraphModel(modelPath);
      return model;
    } catch (error) {
      throw new Error(`Failed to load graph model from ${modelPath}: ${error.message}`);
    }
  }

  /**
   * Load a RemoteModel from a URL
   * @param {string} modelUrl - URL to the model
   * @returns {Promise<tf.LayersModel>} Loaded model
   */
  async loadRemoteModel(modelUrl) {
    try {
      if (!modelUrl.startsWith('http')) {
        throw new Error('URL must start with http or https');
      }
      
      const model = await tf.loadLayersModel(modelUrl);
      return model;
    } catch (error) {
      throw new Error(`Failed to load remote model from ${modelUrl}: ${error.message}`);
    }
  }

  /**
   * List available pre-trained models
   * @returns {Object} Available models information
   */
  static getAvailableModels() {
    return {
      mobilenet: {
        description: 'MobileNet - Image classification',
        url: 'https://tfhub.dev/google/tfjs-models/mobilenet_v2/classification/3',
        type: 'image-classification'
      },
      coco_ssd: {
        description: 'COCO-SSD - Object detection',
        url: 'https://tfhub.dev/tensorflow/tfjs-models/coco-ssd/1',
        type: 'object-detection'
      },
      posenet: {
        description: 'PoseNet - Pose detection',
        url: 'https://tfhub.dev/google/tfjs-models/posenet/mobilenet/float/050/2',
        type: 'pose-detection'
      },
      universal_sentence_encoder: {
        description: 'Universal Sentence Encoder - Text embeddings',
        url: 'https://tfhub.dev/google/universal-sentence-encoder/4',
        type: 'text-embedding'
      }
    };
  }
}

module.exports = new ModelLoader();
