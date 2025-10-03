// Vercel serverless function that imports the Express backend
const path = require('path');

// Import the Express app from the backend
try {
  const backendApp = require('../backend/src/index.js');
  module.exports = backendApp;
} catch (error) {
  console.error('Error importing backend:', error);
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Backend import failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  };
}
