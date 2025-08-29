const serverless = require('serverless-http');
const app = require('./server');

// Configure for Lambda
if (process.env.NODE_ENV === 'production') {
  // Disable console.log in production for better performance
  console.log = () => {};
}

module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});