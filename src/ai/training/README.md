Training folder using TensorFlow.js (Node)

Quick start

- Install the TensorFlow.js native bindings (recommended for Node):

```bash
npm install @tensorflow/tfjs-node
```

- Run training:

```bash
node src/ai/training/train.js
```

What the scripts do

- `model.js`: defines a small dense neural network.
- `data.js`: generates synthetic 2D data and labels (binary classification).
- `train.js`: trains the model, evaluates on a test split, and saves the model to `./model`.

Notes

- Saved model format is in `file://./model` (TensorFlow.js filesystem format).
- Adjust hyperparameters (epochs, layers) in `train.js` and `model.js` as needed.
