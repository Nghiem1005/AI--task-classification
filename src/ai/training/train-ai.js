const { trainingData } = require('./dataset');

// Initialize TensorFlow
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
  console.log('Using TensorFlow with Node.js GPU support');
} catch (e) {
  console.log('Using TensorFlow CPU (tfjs-node not available)');
  tf = require('@tensorflow/tfjs');
}

const fs = require('fs');
const path = require('path');

// Attempt to dynamically resolve natural's tokenizer path to avoid loading the entire package
let tokenizer;
try {
  const candidate = 'natural/lib/natural/tokenizers/word_tokenizer';
  console.log('Resolving tokenizer path for:', candidate);
  const resolvedPath = require.resolve(candidate);
  console.log('Resolved tokenizer path:', resolvedPath);
  const WordTokenizer = require(candidate);
  tokenizer = new WordTokenizer();
} catch (err) {
  console.warn('Cannot load natural tokenizer directly, falling back to simple split. Error:', err.message);
  // fallback simple tokenizer
  tokenizer = {
    tokenize: text => text.toLowerCase().split(/\s+/).filter(t => t)
  };
}

/**
 * Tokenizes text using whichever tokenizer is available
 * @param {string} text - Text to tokenize
 * @returns {Array<string>} Array of tokens
 */
function tokenizeText(text) {
  return tokenizer.tokenize(text.toLowerCase());
}

/**
 * Bag-of-words vectorization for a single list of tokens
 * @param {Array<string>} tokens - Tokenized text
 * @param {Object} vocab - Vocabulary mapping word->index
 * @returns {Array<number>} Vector of word counts
 */
function bagOfWordsVector(tokens, vocab) {
  const vector = Array(Object.keys(vocab).length).fill(0);
  tokens.forEach(token => {
    const idx = vocab[token];
    if (idx !== undefined) {
      // convert 1-based idx to 0-based array
      vector[idx - 1] += 1;
    }
  });
  return vector;
}

/**
 * Build vocabulary from all training texts
 * @param {Array<Object>} data - Training data with text and label
 * @returns {Object} Vocabulary mapping { word: index }
 */
function buildVocabulary(data) {
  const vocab = new Set();
  
  data.forEach(item => {
    const tokens = tokenizeText(item.text);
    tokens.forEach(token => vocab.add(token));
  });
  
  // Convert set to object with index mapping
  const vocabularyMap = {};
  Array.from(vocab)
    .sort()
    .forEach((word, index) => {
      vocabularyMap[word] = index + 1; // Start from 1, 0 reserved for padding
    });
  
  console.log(`Vocabulary size: ${Object.keys(vocabularyMap).length}`);
  return vocabularyMap;
}

/**
 * Convert tokens to numerical values based on vocabulary
 * @param {Array<string>} tokens - Array of tokens
 * @param {Object} vocab - Vocabulary mapping
 * @returns {Array<number>} Array of indices
 */
function tokensToIndices(tokens, vocab) {
  return tokens.map(token => vocab[token] || 0); // 0 for unknown words
}

/**
 * Pad sequences to fixed length
 * @param {Array<number>} sequence - Sequence of indices
 * @param {number} maxLength - Maximum sequence length
 * @param {number} padValue - Padding value (default 0)
 * @returns {Array<number>} Padded sequence
 */
function padSequence(sequence, maxLength, padValue = 0) {
  if (sequence.length >= maxLength) {
    return sequence.slice(0, maxLength);
  }
  
  const padded = Array(maxLength).fill(padValue);
  sequence.forEach((val, idx) => {
    padded[idx] = val;
  });
  
  return padded;
}

/**
 * Vectorize dataset using tokenization and padding
 * @param {Array<Object>} data - Training data
 * @param {Object} vocab - Vocabulary mapping
 * @param {number} maxLength - Maximum sequence length (default 50)
 * @returns {Object} { sequences: Array, labels: Array, vocab: Object }
 */
function vectorizeData(data, vocab, options = {}) {
  // options.mode: 'sequence' (default) or 'bow'
  const { maxLength = 50, mode = 'sequence' } = options;
  const sequences = [];
  const labels = [];
  
  data.forEach(item => {
    // Tokenize text
    const tokens = tokenizeText(item.text);
    
    let vector;
    if (mode === 'bow') {
      // bag of words representation
      vector = bagOfWordsVector(tokens, vocab);
    } else {
      // normal sequence of indices with padding
      const indices = tokensToIndices(tokens, vocab);
      vector = padSequence(indices, maxLength);
    }
    
    sequences.push(vector);
    labels.push(item.label);
  });
  
  return {
    sequences,
    labels,
    vocab,
    vocabSize: Object.keys(vocab).length,
    maxLength,
    mode
  };
}

/**
 * Convert sequences and labels to TensorFlow tensors
 * @param {Array<Array<number>>} sequences - Vectorized sequences
 * @param {Array<number>} labels - Labels
 * @param {number} numClasses - Number of classification classes
 * @returns {Object} { xTensor: Tensor, yTensor: Tensor }
 */
function createTensors(sequences, labels, numClasses = 3) {
  // Create input tensor from sequences
  const xTensor = tf.tensor2d(sequences, [sequences.length, sequences[0].length], 'int32');
  
  // Convert labels to one-hot encoded tensor
  const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);
  
  return {
    xTensor,
    yTensor,
    inputShape: xTensor.shape,
    outputShape: yTensor.shape
  };
}

/**
 * Complete pipeline: tokenize, vectorize, and create tensors
 * @param {Array<Object>} data - Training data
 * @param {Object} options - Configuration options
 * @returns {Object} Complete dataset with tensors
 */
async function prepareDataset(data, options = {}) {
  const {
    maxLength = 50,
    numClasses = 3,
    testSplit = 0.2,
    mode = 'sequence'
  } = options;
  
  console.log('Starting data preparation pipeline...');
  console.log(`Total samples: ${data.length}`);
  
  // Step 1: Build vocabulary
  console.log('\n[Step 1] Building vocabulary from dataset...');
  const vocab = buildVocabulary(data);
  
  // Step 2: Vectorize data
  console.log('\n[Step 2] Vectorizing data...');
  const vectorized = vectorizeData(data, vocab, { maxLength, mode });
  console.log(`Sequences shape: [${vectorized.sequences.length}, ${vectorized.sequences[0].length}]`);
  console.log(`Labels: ${vectorized.labels.length}`);
  
  // Step 3: Create tensors
  console.log('\n[Step 3] Creating TensorFlow tensors...');
  const { xTensor, yTensor, inputShape, outputShape } = createTensors(
    vectorized.sequences,
    vectorized.labels,
    numClasses
  );
  console.log(`Input tensor shape: ${inputShape}`);
  console.log(`Output tensor shape: ${outputShape}`);
  
  // Step 4: Split into train and test sets
  console.log('\n[Step 4] Splitting dataset...');
  const splitIndex = Math.floor(data.length * (1 - testSplit));
  
  const {
    xTensor: xTrain,
    yTensor: yTrain
  } = tf.tidy(() => {
    return {
      xTensor: xTensor.slice([0, 0], [splitIndex, -1]),
      yTensor: yTensor.slice([0, 0], [splitIndex, -1])
    };
  });
  
  const {
    xTensor: xTest,
    yTensor: yTest
  } = tf.tidy(() => {
    return {
      xTensor: xTensor.slice([splitIndex, 0], [-1, -1]),
      yTensor: yTensor.slice([splitIndex, 0], [-1, -1])
    };
  });
  
  // Dispose original tensors
  xTensor.dispose();
  yTensor.dispose();
  
  console.log(`Train set: ${splitIndex} samples`);
  console.log(`Test set: ${data.length - splitIndex} samples`);
  
  return {
    train: {
      x: xTrain,
      y: yTrain,
      shape: xTrain.shape
    },
    test: {
      x: xTest,
      y: yTest,
      shape: xTest.shape
    },
    metadata: {
      vocabSize: vectorized.vocabSize,
      maxLength: vectorized.maxLength,
      numClasses,
      totalSamples: data.length,
      trainSamples: splitIndex,
      testSamples: data.length - splitIndex,
      vocab: vectorized.vocab
    }
  };
}

/**
 * Example tokenization demonstration
 */
function demonstrateTokenization() {
  console.log('\n========== TOKENIZATION DEMONSTRATION ==========\n');
  
  const sampleTexts = [
    "Hoàn thành bài tập AI",
    "Đi mua đồ ăn",
    "Làm việc tại công ty"
  ];
  
  sampleTexts.forEach(text => {
    const tokens = tokenizeText(text);
    console.log(`Text: "${text}"`);
    console.log(`Tokens: ${JSON.stringify(tokens)}`);
    console.log('---');
  });
}

// simple neural network trainer
async function trainModel(dataset, opts = {}) {
  const { epochs = 10, batchSize = 8, learningRate = 0.01 } = opts;
  const { train } = dataset;
  const inputDim = train.x.shape[1];
  const numClasses = train.y.shape[1];

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [inputDim], units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  const optimizer = tf.train.adam(learningRate);
  model.compile({ optimizer, loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  console.log(`\n[Training] epochs=${epochs}, batchSize=${batchSize}`);
  await model.fit(train.x, train.y, {
    epochs,
    batchSize,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`epoch ${epoch+1} loss=${logs.loss.toFixed(4)} acc=${(logs.acc||logs.accuracy).toFixed(4)}`);
      }
    }
  });

  return model;
}

/**
 * Load a previously saved model and vocabulary from disk
 * @param {string} baseDir - directory containing model.json, vocab.json, and weights.meta.json
 * @returns {Object} { model, vocab }
 */
async function loadModelAndVocab(baseDir) {
  const vocabPath = path.join(baseDir, 'vocab.json');
  const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
  const modelJsonPath = path.join(baseDir, 'model.json');
  let model;
  
  const weightsMetaPath = path.join(baseDir, 'weights.meta.json');
  if (fs.existsSync(weightsMetaPath)) {
    // Load model configuration
    const modelConfig = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    
    // Load binary weights using custom function
    const tensors = loadWeightsBinary(baseDir);
    model = await tf.models.modelFromJSON(modelConfig);
    model.setWeights(tensors);
    console.log('Model loaded with binary weights');
  } else if (fs.existsSync(path.join(baseDir, 'weights.json'))) {
    // Fallback: Load JSON weights
    const modelConfig = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    const weightObjs = JSON.parse(fs.readFileSync(path.join(baseDir, 'weights.json'), 'utf8'));
    model = await tf.models.modelFromJSON(modelConfig);
    const tensors = weightObjs.map(w => tf.tensor(w.data, w.shape, w.dtype));
    model.setWeights(tensors);
    console.log('Model loaded with JSON weights');
  } else {
    model = await tf.loadLayersModel(`file://${modelJsonPath}`);
  }
  
  return { model, vocab };
}

/**
 * Make a prediction for a given text using a bag-of-words model
 * @param {string} text - raw input text
 * @param {tf.LayersModel} model - loaded TensorFlow model
 * @param {Object} vocab - vocabulary mapping word->index
 * @returns {Array<number>} softmax scores
 */
function predictText(text, model, vocab) {
  const tokens = tokenizeText(text);
  const vector = bagOfWordsVector(tokens, vocab);
  const input = tf.tensor2d([vector], [1, vector.length], 'int32');
  const probs = model.predict(input);
  const result = probs.dataSync();
  input.dispose();
  probs.dispose();
  return result;
}

/**
 * Save model weights in binary format (.bin)
 * @param {tf.LayersModel} model - TensorFlow model
 * @param {string} outputDir - Directory to save weights
 */
async function saveWeightsBinary(model, outputDir) {
  const weights = model.getWeights();
  
  // Create metadata for weights (shape, dtype, size)
  const metadata = {
    count: weights.length,
    weights: weights.map((w, idx) => ({
      index: idx,
      name: w.name,
      shape: w.shape,
      dtype: w.dtype,
      size: w.size
    }))
  };
  
  // Save metadata as JSON
  const metadataPath = path.join(outputDir, 'weights.meta.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`Weights metadata saved to ${metadataPath}`);
  
  // Save each weight as binary
  const weightsDir = path.join(outputDir, 'weights');
  if (!fs.existsSync(weightsDir)) {
    fs.mkdirSync(weightsDir, { recursive: true });
  }
  
  let totalBytes = 0;
  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i];
    const data = weight.dataSync();
    
    // Convert Float32Array to Buffer
    const buffer = Buffer.from(new Float32Array(data).buffer);
    const weightPath = path.join(weightsDir, `weight_${i}.bin`);
    fs.writeFileSync(weightPath, buffer);
    
    totalBytes += buffer.length;
    console.log(`Weight ${i} (${weight.name}): saved ${buffer.length} bytes`);
  }
  
  console.log(`Total binary weights: ${totalBytes} bytes`);
  console.log(`All weights saved to ${weightsDir}`);
}

/**
 * Load binary format weights
 * @param {string} outputDir - Directory containing weights
 * @returns {Array<tf.Tensor>} Array of weight tensors
 */
function loadWeightsBinary(outputDir) {
  const metadataPath = path.join(outputDir, 'weights.meta.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  const weightsDir = path.join(outputDir, 'weights');
  const tensors = [];
  
  metadata.weights.forEach(info => {
    const weightPath = path.join(weightsDir, `weight_${info.index}.bin`);
    const buffer = fs.readFileSync(weightPath);
    
    // Convert Buffer back to Float32Array
    const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
    const tensor = tf.tensor(float32Array, info.shape, info.dtype);
    tensors.push(tensor);
    
    console.log(`Loaded weight ${info.index} from ${weightPath}`);
  });
  
  return tensors;
}

/**
 * Serialize model configuration and weights manually when file handler is missing
 * @param {tf.LayersModel} model
 * @param {string} outputDir
 */
async function saveModelCustom(model, outputDir) {
  // model configuration only
  const modelJson = model.toJSON(null, false);
  fs.writeFileSync(path.join(outputDir, 'model.json'), JSON.stringify(modelJson));

  // manually serialize weights as simple arrays
  const weightObjs = model.getWeights().map(w => ({
    name: w.name,
    shape: w.shape,
    dtype: w.dtype,
    data: Array.from(w.dataSync())
  }));
  fs.writeFileSync(path.join(outputDir, 'weights.json'), JSON.stringify(weightObjs));
}

/**
 * Main execution
 */
async function main() {
  try {
    demonstrateTokenization();
    
    console.log('\n========== DATA PREPARATION PIPELINE ==========\n');
    
    // Prepare dataset with bag-of-words encoding
    const dataset = await prepareDataset(trainingData, {
      maxLength: 50,
      numClasses: 3,
      testSplit: 0.2,
      mode: 'bow'
    });
    
    console.log('\n========== DATASET SUMMARY ==========\n');
    console.log('Metadata:', dataset.metadata);
    
    // Train a simple neural network on the bag‑of‑words vectors
    const model = await trainModel(dataset, { epochs: 15, batchSize: 8, learningRate: 0.01 });
    console.log('\nModel summary:');
    model.summary();

    // Save vocabulary and model for later prediction
    const outputDir = path.join(__dirname, '..', '..', 'models', 'bow-model');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const vocabPath = path.join(outputDir, 'vocab.json');
    fs.writeFileSync(vocabPath, JSON.stringify(dataset.metadata.vocab, null, 2));
    console.log(`Vocabulary saved to ${vocabPath}`);

    // Save model configuration
    const modelJson = model.toJSON(null, false);
    const modelJsonPath = path.join(outputDir, 'model.json');
    fs.writeFileSync(modelJsonPath, JSON.stringify(modelJson));
    console.log(`Model configuration saved to ${modelJsonPath}`);

    // Save weights in binary format (.bin)
    console.log('\n[Saving] Weights in binary format...');
    await saveWeightsBinary(model, outputDir);
    
    // Clean up tensors after use
    dataset.train.x.dispose();
    dataset.train.y.dispose();
    dataset.test.x.dispose();
    dataset.test.y.dispose();
    
    console.log('\nData preparation, training and saving completed successfully!');
    
  } catch (error) {
    console.error('Error during data preparation:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  tokenizeText,
  buildVocabulary,
  tokensToIndices,
  padSequence,
  vectorizeData,
  createTensors,
  prepareDataset,
  demonstrateTokenization,
  trainModel,
  loadModelAndVocab,
  predictText,
  saveModelCustom,
  saveWeightsBinary,
  loadWeightsBinary
};

// Run main if this is the entry point
if (require.main === module) {
  main();
}
if (require.main === module) {
  main();
}
