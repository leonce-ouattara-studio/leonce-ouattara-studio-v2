const crypto = require('crypto');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/error/errorHandler');
const logger = require('../config/logger');

// Fonction utilitaire pour créer et envoyer un token
const createSendToken = (user, statusCode, res, message = 'Succès') => {
  const token = user.signToken();
  const refreshToken = user.signRefreshToken();
  
  // Options pour les cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Envoyer le cookie
  res.cookie('token', token, cookieOptions);

  // Sauvegarder le refresh token
  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date()
  });
  user.save({ validateBeforeSave: false });

  // Supprimer le mot de passe de la réponse
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    refreshToken,
    data: {
      user
    }
  });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/v1/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Un utilisateur avec cet email existe déjà', 400));
  }

  // Créer l'utilisateur
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'user'
  });

  logger.info(`New user registered: ${email}`);

  createSendToken(user, 201, res, 'Inscription réussie');
});

// @desc    Connexion utilisateur
// @route   POST /api/v1/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Trouver l'utilisateur et inclure le mot de passe
  const user = await User.findOne({ email }).select('+password');

  // Vérifier si le compte est verrouillé
  if (user && user.isLocked) {
    return next(new AppError('Compte temporairement verrouillé. Réessayez plus tard.', 423));
  }

  // Vérifier l'utilisateur et le mot de passe
  if (!user || !(await user.correctPassword(password, user.password))) {
    if (user) {
      await user.incLoginAttempts();
    }
    return next(new AppError('Email ou mot de passe incorrect', 401));
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    return next(new AppError('Compte désactivé. Contactez l\'administrateur.', 401));
  }

  // Réinitialiser les tentatives de connexion
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Mettre à jour la dernière connexion
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);

  createSendToken(user, 200, res, 'Connexion réussie');
});

// @desc    Déconnexion utilisateur
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  // Supprimer le cookie
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  // Supprimer les refresh tokens de l'utilisateur
  if (req.user) {
    req.user.refreshTokens = [];
    await req.user.save({ validateBeforeSave: false });
    
    logger.info(`User logged out: ${req.user.email}`);
  }

  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// @desc    Obtenir l'utilisateur actuel
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = catchAsync(async (req, res, next) => {
  // Empêcher la mise à jour du mot de passe via cette route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Cette route n\'est pas pour la mise à jour du mot de passe', 400));
  }

  // Filtrer les champs autorisés
  const allowedFields = ['firstName', 'lastName', 'email', 'avatar'];
  const filteredBody = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Mettre à jour l'utilisateur
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  logger.info(`User profile updated: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: updatedUser
    }
  });
});

// @desc    Changer le mot de passe
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Obtenir l'utilisateur avec le mot de passe
  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Mot de passe actuel incorrect', 400));
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  createSendToken(user, 200, res, 'Mot de passe modifié avec succès');
});

// @desc    Mot de passe oublié
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  // Obtenir l'utilisateur basé sur l'email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Aucun utilisateur trouvé avec cet email', 404));
  }

  // Générer le token de réinitialisation
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested for: ${user.email}`);

  // En production, vous enverriez un email ici
  // Pour le développement, on retourne le token
  res.status(200).json({
    success: true,
    message: 'Token de réinitialisation envoyé par email',
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

// @desc    Réinitialiser le mot de passe
// @route   PATCH /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  // Obtenir l'utilisateur basé sur le token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // Si le token n'a pas expiré et qu'il y a un utilisateur, définir le nouveau mot de passe
  if (!user) {
    return next(new AppError('Token invalide ou expiré', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset completed for: ${user.email}`);

  createSendToken(user, 200, res, 'Mot de passe réinitialisé avec succès');
});

// @desc    Rafraîchir le token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token requis', 401));
  }

  // Vérifier le refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
  // Trouver l'utilisateur
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('Utilisateur non trouvé', 401));
  }

  // Vérifier que le refresh token existe
  const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
  if (!tokenExists) {
    return next(new AppError('Refresh token invalide', 401));
  }

  // Supprimer l'ancien refresh token
  user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
  
  createSendToken(user, 200, res, 'Token rafraîchi avec succès');
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken
};