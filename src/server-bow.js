/**
 * Test the BOW Model Prediction API
 */
const http = require('http');
const path = require('path');

// Check if port 3000 is available first
const server = http.createServer();
server.listen(3000, () => {
  console.log('Port 3000 is available');
  server.close();
  
  // Now require the app
  const app = require('./src/app');
  app.listen(3000, () => {
    console.log('Express server running on port 3000');
    console.log('\nAPI Endpoints:');
    console.log('POST   /api/bow/initialize - Load the BOW model');
    console.log('POST   /api/bow/predict - Predict text category');
    console.log('POST   /api/bow/batch-predict - Batch predict');
    console.log('GET    /api/bow/status - Get model status\n');
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port 3000 is already in use');
    process.exit(1);
  } else {
    throw err;
  }
});
