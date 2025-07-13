const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting pour les réservations
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de réservation par IP
  message: {
    success: false,
    message: 'Trop de tentatives de réservation. Réessayez dans 15 minutes.'
  }
});

// Validation pour la création d'un rendez-vous
const validateAppointment = [
  body('service.id')
    .notEmpty()
    .withMessage('L\'ID du service est requis'),
  body('service.name')
    .notEmpty()
    .withMessage('Le nom du service est requis'),
  body('service.duration')
    .isInt({ min: 30, max: 480 })
    .withMessage('La durée doit être entre 30 et 480 minutes'),
  body('service.price')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être positif'),
    
  body('dateTime.date')
    .isISO8601()
    .withMessage('Date invalide')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        throw new Error('Impossible de réserver dans le passé');
      }
      
      // Limite à 3 mois dans le futur
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (date > maxDate) {
        throw new Error('Réservation limitée à 3 mois maximum');
      }
      
      return true;
    }),
  body('dateTime.startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
    
  body('client.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('client.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('client.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('client.phone')
    .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
    .withMessage('Numéro de téléphone français invalide'),
  body('client.company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut dépasser 100 caractères'),
  body('client.projectType')
    .optional()
    .isIn(['website', 'ecommerce', 'mobile', 'consulting', 'other'])
    .withMessage('Type de projet invalide'),
  body('client.message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Le message ne peut dépasser 1000 caractères'),
    
  body('payment.option')
    .isIn(['onsite', 'full', 'deposit'])
    .withMessage('Option de paiement invalide'),
    
  body('metadata.rgpdConsent')
    .equals('true')
    .withMessage('Le consentement RGPD est obligatoire')
];

// Validation pour le feedback
const validateFeedback = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le commentaire ne peut dépasser 500 caractères'),
  body('satisfaction')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La satisfaction doit être entre 1 et 5'),
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('La recommandation doit être un booléen'),
  body('followUpNeeded')
    .optional()
    .isBoolean()
    .withMessage('Le suivi doit être un booléen')
];

// Routes publiques

// Obtenir les créneaux disponibles
router.get('/available-slots', [
  query('date')
    .isISO8601()
    .withMessage('Date invalide'),
  query('duration')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('Durée invalide')
], appointmentController.getAvailableSlots);

// Créer un nouveau rendez-vous
router.post('/', bookingLimiter, validateAppointment, appointmentController.createAppointment);

// Obtenir les détails d'un rendez-vous (avec ID public)
router.get('/:id', [
  param('id').isMongoId().withMessage('ID invalide')
], appointmentController.getAppointment);

// Confirmer un rendez-vous
router.post('/:id/confirm', [
  param('id').isMongoId().withMessage('ID invalide'),
  body('paymentIntentId')
    .optional()
    .isString()
    .withMessage('ID de paiement invalide')
], appointmentController.confirmAppointment);

// Annuler un rendez-vous
router.post('/:id/cancel', [
  param('id').isMongoId().withMessage('ID invalide'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La raison ne peut dépasser 200 caractères')
], appointmentController.cancelAppointment);

// Reporter un rendez-vous
router.post('/:id/reschedule', [
  param('id').isMongoId().withMessage('ID invalide'),
  body('newDate')
    .isISO8601()
    .withMessage('Nouvelle date invalide'),
  body('newStartTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Nouvelle heure invalide'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La raison ne peut dépasser 200 caractères')
], appointmentController.rescheduleAppointment);

// Ajouter un feedback
router.post('/:id/feedback', [
  param('id').isMongoId().withMessage('ID invalide'),
  ...validateFeedback
], appointmentController.addFeedback);

// Routes administrateur (protégées)

// Lister tous les rendez-vous
router.get('/', protect, restrictTo('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('Statut invalide'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Recherche trop courte')
], appointmentController.getAppointments);

// Statistiques des rendez-vous
router.get('/stats', protect, restrictTo('admin'), [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide')
], appointmentController.getAppointmentStats);

module.exports = router;