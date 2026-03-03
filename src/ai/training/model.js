const tf = require('@tensorflow/tfjs-node');

function createModel(inputDim, numClasses) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [inputDim] }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  return model;
}

module.exports = { createModel };