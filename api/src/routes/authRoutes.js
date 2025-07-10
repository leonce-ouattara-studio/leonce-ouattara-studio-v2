const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken
} = require('../controllers/authController');

const { authenticate } = require('../middleware/auth/auth');
const { validate, authSchemas } = require('../middleware/validation/validation');
const { authLimiter } = require('../config/rateLimiter');

const router = express.Router();

// Routes publiques avec rate limiting strict
router.post('/register', authLimiter, validate(authSchemas.register), register);
router.post('/login', authLimiter, validate(authSchemas.login), login);
router.post('/forgot-password', authLimiter, validate(authSchemas.forgotPassword), forgotPassword);
router.patch('/reset-password/:token', authLimiter, validate(authSchemas.resetPassword), resetPassword);
router.post('/refresh-token', refreshToken);

// Routes protégées
router.use(authenticate); // Toutes les routes suivantes nécessitent une authentification

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/change-password', changePassword);

module.exports = router;