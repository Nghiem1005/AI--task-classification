const tf = require('@tensorflow/tfjs-node');
const { createModel } = require('./model');
const { getData } = require('./data');

async function run() {
  const { trainXs, trainYs, testXs, testYs } = getData(2000);
  const model = createModel(2, 2);
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  console.log('Starting training...');
  await model.fit(trainXs, trainYs, { epochs: 30, batchSize: 32, validationSplit: 0.1 });
  console.log('Evaluating on test set...');
  const evalRes = model.evaluate(testXs, testYs);
  const accTensor = Array.isArray(evalRes) ? evalRes[1] : evalRes;
  const acc = await accTensor.data();
  console.log('Test accuracy:', acc[0]);
  await model.save('file://./model');
  console.log('Model saved to ./model');
}

run().catch(err => console.error(err));