// Vercel serverless function that imports the Express backend
const path = require('path');

// Import the Express app from the backend
const backendApp = require('../backend/src/index.js');

// Export the Express app as a Vercel serverless function
module.exports = backendApp;
