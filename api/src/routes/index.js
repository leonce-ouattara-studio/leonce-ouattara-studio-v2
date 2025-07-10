const express = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');

const router = express.Router();

// Routes principales
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// Route de santé de l'API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

// Route d'information sur l'API
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l\'API Leonce Ouattara Studio',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: '/api/v1/auth',
      projects: '/api/v1/projects',
      health: '/api/v1/health'
    }
  });
});

module.exports = router;