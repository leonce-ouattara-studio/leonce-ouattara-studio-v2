const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Informations de base
  appointmentId: {
    type: String,
    unique: true,
    required: true,
    default: () => `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Service sélectionné
  service: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, required: true }, // en minutes
    price: { type: Number, required: true }
  },
  
  // Créneau horaire
  dateTime: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // Format HH:MM
    endTime: { type: String, required: true },
    timezone: { type: String, default: 'Europe/Paris' }
  },
  
  // Informations client
  client: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    phone: { 
      type: String, 
      required: true,
      match: [/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numéro de téléphone invalide']
    },
    company: { type: String, trim: true },
    projectType: { 
      type: String, 
      enum: ['website', 'ecommerce', 'mobile', 'consulting', 'other'] 
    },
    budget: { type: String },
    message: { type: String, maxlength: 1000 },
    
    // Géolocalisation pour calcul trajet
    location: {
      address: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'France' },
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // Statut du rendez-vous
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  
  // Paiement
  payment: {
    option: { 
      type: String, 
      enum: ['onsite', 'full', 'deposit'], 
      required: true 
    },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    stripePaymentIntentId: String,
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  
  // Notifications et rappels
  notifications: {
    confirmationSent: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    followUpSent: { type: Boolean, default: false },
    
    emailsSent: [{
      type: { type: String, enum: ['confirmation', 'reminder', 'cancellation', 'followup'] },
      sentAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['sent', 'delivered', 'failed'] }
    }]
  },
  
  // Gestion des modifications
  modifications: [{
    type: { type: String, enum: ['reschedule', 'cancel', 'modify'] },
    reason: String,
    oldDateTime: Date,
    newDateTime: Date,
    modifiedAt: { type: Date, default: Date.now },
    modifiedBy: { type: String, enum: ['client', 'admin'] }
  }],
  
  // Feedback post-RDV
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    submittedAt: Date,
    
    // Questions spécifiques
    satisfaction: { type: Number, min: 1, max: 5 },
    wouldRecommend: Boolean,
    followUpNeeded: Boolean
  },
  
  // Métadonnées
  metadata: {
    source: { type: String, default: 'website' }, // website, phone, referral
    userAgent: String,
    ipAddress: String,
    referrer: String,
    
    // Analytics
    conversionSource: String, // google, facebook, direct, etc.
    campaignId: String,
    
    // Conformité RGPD
    rgpdConsent: { type: Boolean, required: true },
    consentDate: { type: Date, default: Date.now },
    dataRetentionUntil: { 
      type: Date, 
      default: () => new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 ans
    }
  },
  
  // Synchronisation calendrier
  calendar: {
    googleEventId: String,
    outlookEventId: String,
    icsGenerated: { type: Boolean, default: false },
    lastSyncAt: Date
  },
  
  // Notes internes (admin uniquement)
  internalNotes: [{
    note: String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
appointmentSchema.index({ 'dateTime.date': 1, status: 1 });
appointmentSchema.index({ 'client.email': 1 });
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ 'payment.status': 1 });

// Virtuals
appointmentSchema.virtual('clientFullName').get(function() {
  return `${this.client.firstName} ${this.client.lastName}`;
});

appointmentSchema.virtual('isUpcoming').get(function() {
  return this.dateTime.date > new Date() && this.status !== 'cancelled';
});

appointmentSchema.virtual('isPast').get(function() {
  return this.dateTime.date < new Date();
});

appointmentSchema.virtual('duration').get(function() {
  return this.service.duration;
});

// Méthodes d'instance
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = this.dateTime.date;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= 24 && this.status === 'confirmed';
};

appointmentSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentTime = this.dateTime.date;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= 48 && ['pending', 'confirmed'].includes(this.status);
};

appointmentSchema.methods.generateICS = function() {
  const start = new Date(this.dateTime.date);
  const end = new Date(start.getTime() + this.service.duration * 60000);
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Leonce Ouattara Studio//Appointment//EN
BEGIN:VEVENT
UID:${this.appointmentId}@leonceouattara.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${this.service.name} - Leonce Ouattara Studio
DESCRIPTION:Rendez-vous confirmé pour ${this.service.name}\\nDurée: ${this.service.duration} minutes\\nClient: ${this.clientFullName}
LOCATION:À définir
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
};

// Méthodes statiques
appointmentSchema.statics.getAvailableSlots = async function(date, serviceDuration = 60) {
  const startOfDay = new Date(date);
  startOfDay.setHours(9, 0, 0, 0); // 9h00
  
  const endOfDay = new Date(date);
  endOfDay.setHours(18, 0, 0, 0); // 18h00
  
  // Récupérer les RDV existants pour cette date
  const existingAppointments = await this.find({
    'dateTime.date': {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ 'dateTime.date': 1 });
  
  const slots = [];
  const slotDuration = 30; // Créneaux de 30 minutes
  
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      
      // Vérifier si le créneau est libre
      const isAvailable = !existingAppointments.some(apt => {
        const aptStart = apt.dateTime.date;
        const aptEnd = new Date(aptStart.getTime() + apt.service.duration * 60000);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });
      
      if (isAvailable && slotEnd.getHours() <= 18) {
        slots.push({
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          available: true
        });
      }
    }
  }
  
  return slots;
};

appointmentSchema.statics.getStatistics = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        'dateTime.date': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        confirmedAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        completedAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.amount', 0] }
        },
        averageRating: { $avg: '$feedback.rating' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

// Middleware pre-save
appointmentSchema.pre('save', function(next) {
  // Calculer l'heure de fin automatiquement
  if (this.dateTime.date && this.service.duration) {
    const endTime = new Date(this.dateTime.date.getTime() + this.service.duration * 60000);
    this.dateTime.endTime = endTime.toTimeString().slice(0, 5);
  }
  
  // Définir le montant du paiement
  if (this.payment.option && this.service.price) {
    switch (this.payment.option) {
      case 'full':
        this.payment.amount = this.service.price;
        break;
      case 'deposit':
        this.payment.amount = Math.round(this.service.price * 0.3);
        break;
      case 'onsite':
        this.payment.amount = 0;
        break;
    }
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);