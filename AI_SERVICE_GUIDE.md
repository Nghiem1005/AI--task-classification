# AI Service Integration Guide

## Installation

Install the required TensorFlow packages:

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

For GPU support:
```bash
npm install @tensorflow/tfjs-node-gpu
```

## Quick Start

### 1. Update your app.js to include AI routes

```javascript
const express = require('express');
const app = express();
const aiRoutes = require('./routes/aiRoutes');

app.use(express.json());
app.use('/api/ai', aiRoutes);

module.exports = app;
```

### 2. Load a Model

```bash
curl -X POST http://localhost:3000/api/ai/load-model \
  -H "Content-Type: application/json" \
  -d '{
    "modelPath": "https://tfhub.dev/google/tfjs-models/mobilenet_v2/classification/3",
    "modelName": "mobilenet-v2"
  }'
```

### 3. Make a Prediction

```bash
curl -X POST http://localhost:3000/api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{
    "input": [[1, 2, 3, 4, 5]]
  }'
```

### 4. Batch Predictions

```bash
curl -X POST http://localhost:3000/api/ai/batch-predict \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
      [3, 4, 5, 6, 7]
    ]
  }'
```

### 5. Get Model Info

```bash
curl http://localhost:3000/api/ai/model-info
```

### 6. Get Available Models

```bash
curl http://localhost:3000/api/ai/available-models
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/load-model` | Load a TensorFlow model |
| POST | `/api/ai/predict` | Make a single prediction |
| POST | `/api/ai/batch-predict` | Make batch predictions |
| GET | `/api/ai/model-info` | Get current model information |
| DELETE | `/api/ai/unload-model` | Unload the current model |
| GET | `/api/ai/available-models` | Get list of available pre-trained models |

## Supported Models

- **MobileNet**: Image classification
- **COCO-SSD**: Object detection
- **PoseNet**: Pose detection
- **Universal Sentence Encoder**: Text embeddings
- Custom TensorFlow models

## File Structure

```
src/
├── services/
│   ├── aiService.js          # Main AI service
│   ├── modelLoader.js        # Model loading utilities
│   └── aiServiceExample.js   # Usage examples
├── controllers/
│   └── aiController.js       # AI request handlers
├── routes/
│   └── aiRoutes.js           # AI API routes
├── config/
│   └── aiConfig.js           # AI configuration
└── ...
models/
└── (place your trained models here)
```

## Understanding the Architecture

### AIService (aiService.js)
- Core service for model management and predictions
- Handles tensor operations
- Memory management (tensor disposal)
- Single model instance management

### ModelLoader (modelLoader.js)
- Loads models from various sources (local paths, URLs)
- Supports different TensorFlow model formats
- Pre-trained model references

### AIController (aiController.js)
- HTTP request handlers
- Input validation
- Error handling and responses

## Usage in Your Code

```javascript
const AIService = require('./src/services/aiService');

// Load a model
await AIService.loadModel('path/to/model.json', 'my-model');

// Make predictions
const result = await AIService.predict([1, 2, 3]);

// Check if model is loaded
if (AIService.isModelLoaded()) {
  console.log(AIService.getModelInfo());
}

// Cleanup
AIService.unloadModel();
```

## Performance Tips

1. Load models once and reuse them
2. Use batch predictions for multiple inputs
3. Dispose of tensors properly to avoid memory leaks
4. Enable GPU acceleration for faster inference
5. Monitor memory usage with large batch sizes

## Environment Variables

Add to your `.env`:
```
AI_MODEL_PATH=path/to/your/model.json
AI_GPU_ENABLED=true
AI_BATCH_SIZE=32
```
