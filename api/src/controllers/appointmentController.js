const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Créer un nouveau rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      service,
      dateTime,
      client,
      payment,
      metadata
    } = req.body;

    // Vérifier la disponibilité du créneau
    const existingAppointment = await Appointment.findOne({
      'dateTime.date': new Date(dateTime.date),
      'dateTime.startTime': dateTime.startTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Ce créneau n\'est plus disponible'
      });
    }

    // Créer le rendez-vous
    const appointment = new Appointment({
      service,
      dateTime: {
        date: new Date(dateTime.date),
        startTime: dateTime.startTime,
        timezone: dateTime.timezone || 'Europe/Paris'
      },
      client,
      payment,
      metadata: {
        ...metadata,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await appointment.save();

    // Générer le fichier ICS
    const icsContent = appointment.generateICS();

    // TODO: Envoyer email de confirmation
    // await sendConfirmationEmail(appointment, icsContent);

    logger.info('Nouveau rendez-vous créé', {
      appointmentId: appointment.appointmentId,
      clientEmail: appointment.client.email,
      service: appointment.service.name
    });

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: {
        appointment: {
          id: appointment._id,
          appointmentId: appointment.appointmentId,
          service: appointment.service,
          dateTime: appointment.dateTime,
          status: appointment.status,
          payment: appointment.payment
        },
        icsFile: icsContent
      }
    });

  } catch (error) {
    logger.error('Erreur création rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du rendez-vous'
    });
  }
};

// Obtenir les créneaux disponibles
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise'
      });
    }

    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de réserver dans le passé'
      });
    }

    const availableSlots = await Appointment.getAvailableSlots(requestedDate, parseInt(duration));

    res.json({
      success: true,
      data: {
        date: requestedDate.toISOString().split('T')[0],
        slots: availableSlots
      }
    });

  } catch (error) {
    logger.error('Erreur récupération créneaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des créneaux'
    });
  }
};

// Confirmer un rendez-vous
exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentIntentId } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce rendez-vous ne peut pas être confirmé'
      });
    }

    // Mettre à jour le statut
    appointment.status = 'confirmed';
    
    if (paymentIntentId) {
      appointment.payment.stripePaymentIntentId = paymentIntentId;
      appointment.payment.status = 'paid';
      appointment.payment.paidAt = new Date();
    }

    appointment.notifications.confirmationSent = true;
    await appointment.save();

    logger.info('Rendez-vous confirmé', {
      appointmentId: appointment.appointmentId,
      clientEmail: appointment.client.email
    });

    res.json({
      success: true,
      message: 'Rendez-vous confirmé avec succès',
      data: appointment
    });

  } catch (error) {
    logger.error('Erreur confirmation rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la confirmation'
    });
  }
};

// Annuler un rendez-vous
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Ce rendez-vous ne peut plus être annulé (moins de 24h avant)'
      });
    }

    // Enregistrer l'annulation
    appointment.status = 'cancelled';
    appointment.modifications.push({
      type: 'cancel',
      reason: reason || 'Annulation client',
      modifiedBy: 'client'
    });

    // Gérer le remboursement si nécessaire
    if (appointment.payment.status === 'paid') {
      appointment.payment.status = 'refunded';
      appointment.payment.refundedAt = new Date();
      // TODO: Traiter le remboursement Stripe
    }

    await appointment.save();

    logger.info('Rendez-vous annulé', {
      appointmentId: appointment.appointmentId,
      reason: reason
    });

    res.json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      data: appointment
    });

  } catch (error) {
    logger.error('Erreur annulation rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation'
    });
  }
};

// Reporter un rendez-vous
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newStartTime, reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (!appointment.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: 'Ce rendez-vous ne peut plus être reporté (moins de 48h avant)'
      });
    }

    // Vérifier la disponibilité du nouveau créneau
    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      'dateTime.date': new Date(newDate),
      'dateTime.startTime': newStartTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Le nouveau créneau n\'est pas disponible'
      });
    }

    // Enregistrer l'ancien créneau
    const oldDateTime = appointment.dateTime.date;

    // Mettre à jour le rendez-vous
    appointment.dateTime.date = new Date(newDate);
    appointment.dateTime.startTime = newStartTime;
    
    appointment.modifications.push({
      type: 'reschedule',
      reason: reason || 'Report demandé par le client',
      oldDateTime: oldDateTime,
      newDateTime: new Date(newDate),
      modifiedBy: 'client'
    });

    await appointment.save();

    logger.info('Rendez-vous reporté', {
      appointmentId: appointment.appointmentId,
      oldDate: oldDateTime,
      newDate: newDate
    });

    res.json({
      success: true,
      message: 'Rendez-vous reporté avec succès',
      data: appointment
    });

  } catch (error) {
    logger.error('Erreur report rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du report'
    });
  }
};

// Obtenir les détails d'un rendez-vous
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    logger.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Lister les rendez-vous (Admin)
exports.getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Filtres
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query['dateTime.date'] = {};
      if (startDate) query['dateTime.date'].$gte = new Date(startDate);
      if (endDate) query['dateTime.date'].$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { 'client.firstName': { $regex: search, $options: 'i' } },
        { 'client.lastName': { $regex: search, $options: 'i' } },
        { 'client.email': { $regex: search, $options: 'i' } },
        { appointmentId: { $regex: search, $options: 'i' } }
      ];
    }

    const appointments = await Appointment.find(query)
      .sort({ 'dateTime.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-internalNotes -metadata.ipAddress');

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Erreur liste rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Statistiques des rendez-vous (Admin)
exports.getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Appointment.getStatistics(start, end);

    // Statistiques par service
    const serviceStats = await Appointment.aggregate([
      {
        $match: {
          'dateTime.date': { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$service.name',
          count: { $sum: 1 },
          revenue: { $sum: '$payment.amount' },
          avgRating: { $avg: '$feedback.rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Taux de remplissage par jour
    const dailyStats = await Appointment.aggregate([
      {
        $match: {
          'dateTime.date': { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dateTime.date' }
          },
          appointments: { $sum: 1 },
          revenue: { $sum: '$payment.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats,
        byService: serviceStats,
        daily: dailyStats
      }
    });

  } catch (error) {
    logger.error('Erreur statistiques rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ajouter un feedback (Post-RDV)
exports.addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, satisfaction, wouldRecommend, followUpNeeded } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Le feedback ne peut être ajouté que pour les rendez-vous terminés'
      });
    }

    appointment.feedback = {
      rating,
      comment,
      satisfaction,
      wouldRecommend,
      followUpNeeded,
      submittedAt: new Date()
    };

    await appointment.save();

    logger.info('Feedback ajouté', {
      appointmentId: appointment.appointmentId,
      rating: rating
    });

    res.json({
      success: true,
      message: 'Merci pour votre feedback !',
      data: appointment.feedback
    });

  } catch (error) {
    logger.error('Erreur ajout feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};