// Vercel serverless function that imports the Express backend
const path = require('path');

// Simple test function first
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
};
