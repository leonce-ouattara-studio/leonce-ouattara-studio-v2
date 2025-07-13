'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CreditCard, Check, ArrowLeft, ArrowRight, MapPin, Phone, Mail, Euro, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  period: 'morning' | 'afternoon' | 'evening';
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  projectType?: string;
  budget?: string;
  message?: string;
  rgpdConsent: boolean;
}

const AppointmentBooking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budget: '',
    message: '',
    rgpdConsent: false
  });
  const [paymentOption, setPaymentOption] = useState<'onsite' | 'full' | 'deposit'>('onsite');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const services: Service[] = [
    {
      id: 'consultation',
      name: 'Consultation Stratégique',
      category: 'Conseil',
      duration: 60,
      price: 150,
      description: 'Analyse de vos besoins et recommandations personnalisées',
      features: ['Audit technique', 'Stratégie digitale', 'Roadmap projet', 'Devis détaillé'],
      recommended: true
    },
    {
      id: 'audit',
      name: 'Audit Technique Complet',
      category: 'Audit',
      duration: 120,
      price: 300,
      description: 'Analyse approfondie de votre infrastructure existante',
      features: ['Audit sécurité', 'Performance', 'SEO technique', 'Rapport détaillé']
    },
    {
      id: 'formation',
      name: 'Formation Équipe',
      category: 'Formation',
      duration: 180,
      price: 500,
      description: 'Formation personnalisée pour vos équipes',
      features: ['Formation sur mesure', 'Support documentation', 'Suivi 30 jours']
    },
    {
      id: 'workshop',
      name: 'Workshop Innovation',
      category: 'Workshop',
      duration: 240,
      price: 800,
      description: 'Atelier collaboratif pour définir votre vision digitale',
      features: ['Brainstorming', 'Prototypage', 'Plan d\'action', 'Présentation finale']
    }
  ];

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        
        slots.push({
          id: `${date.toISOString().split('T')[0]}-${time}`,
          time,
          available: Math.random() > 0.3, // Simulation de disponibilité
          period
        });
      }
    }
    
    return slots;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep(3);
  };

  const handleBooking = async () => {
    setIsLoading(true);
    
    try {
      // Simulation de l'API de réservation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici vous intégreriez l'API réelle
      console.log('Booking data:', {
        service: selectedService,
        date: selectedDate,
        slot: selectedSlot,
        client: clientInfo,
        payment: paymentOption
      });
      
      // Redirection vers confirmation
      alert('Rendez-vous confirmé ! Vous recevrez un email de confirmation.');
      
    } catch (error) {
      console.error('Booking error:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentAmount = () => {
    if (!selectedService) return 0;
    
    switch (paymentOption) {
      case 'full':
        return selectedService.price;
      case 'deposit':
        return Math.round(selectedService.price * 0.3);
      default:
        return 0;
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#0A0A0B] text-white">
      {/* Header avec étapes */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Réserver un <span className="gradient-text">Rendez-vous</span>
        </h1>
        
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                currentStep >= step 
                  ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white' 
                  : 'bg-gray-700 text-gray-400'
              )}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={cn(
                  'w-16 h-1 mx-2 transition-all',
                  currentStep > step ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD]' : 'bg-gray-700'
                )} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center text-gray-400">
          {currentStep === 1 && 'Choisissez votre service'}
          {currentStep === 2 && 'Sélectionnez votre créneau'}
          {currentStep === 3 && 'Vos informations'}
        </div>
      </div>

      {/* Étape 1: Sélection du service */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className={cn(
                  'glass-card p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:border-[#00F5FF]/50 hover:scale-105',
                  service.recommended ? 'border-[#9D4EDD]/50 bg-[#9D4EDD]/5' : 'border-gray-700/50'
                )}
              >
                {service.recommended && (
                  <div className="bg-gradient-to-r from-[#9D4EDD] to-[#DA70D6] text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 w-fit">
                    Recommandé
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                
                <div className="space-y-2 mb-4">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}min</span>
                  </div>
                  <div className="text-2xl font-bold gradient-text">
                    {service.price}€
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2: Sélection du créneau */}
      {currentStep === 2 && selectedService && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendrier */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold">
                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div key={day} className="text-center text-gray-400 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((day, index) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                const isPast = day.date < new Date();
                
                return (
                  <button
                    key={index}
                    onClick={() => !isPast && day.isCurrentMonth && handleDateSelect(day.date)}
                    disabled={isPast || !day.isCurrentMonth}
                    className={cn(
                      'p-2 text-sm rounded-lg transition-all',
                      {
                        'text-gray-500': !day.isCurrentMonth || isPast,
                        'hover:bg-gray-700': day.isCurrentMonth && !isPast && !isSelected,
                        'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white': isSelected,
                        'ring-2 ring-[#00F5FF]': isToday && !isSelected,
                        'cursor-not-allowed': isPast || !day.isCurrentMonth
                      }
                    )}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Créneaux horaires */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-6">
              Créneaux disponibles
              {selectedDate && (
                <span className="block text-sm text-gray-400 mt-1">
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              )}
            </h3>
            
            {selectedDate ? (
              <div className="space-y-4">
                {['morning', 'afternoon', 'evening'].map((period) => {
                  const periodSlots = generateTimeSlots(selectedDate).filter(slot => slot.period === period);
                  const availableSlots = periodSlots.filter(slot => slot.available);
                  
                  if (availableSlots.length === 0) return null;
                  
                  return (
                    <div key={period}>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 capitalize">
                        {period === 'morning' ? 'Matin' : period === 'afternoon' ? 'Après-midi' : 'Soirée'}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className="p-3 text-sm border border-gray-600 rounded-lg hover:border-[#00F5FF] hover:bg-[#00F5FF]/10 transition-all"
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                Sélectionnez une date pour voir les créneaux disponibles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Étape 3: Informations client */}
      {currentStep === 3 && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-6">Vos informations</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={clientInfo.firstName}
                    onChange={(e) => setClientInfo({...clientInfo, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    value={clientInfo.lastName}
                    onChange={(e) => setClientInfo({...clientInfo, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone *</label>
                <input
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Entreprise</label>
                <input
                  type="text"
                  value={clientInfo.company}
                  onChange={(e) => setClientInfo({...clientInfo, company: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type de projet</label>
                <select
                  value={clientInfo.projectType}
                  onChange={(e) => setClientInfo({...clientInfo, projectType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none"
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="website">Site web</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="mobile">Application mobile</option>
                  <option value="consulting">Conseil</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={clientInfo.message}
                  onChange={(e) => setClientInfo({...clientInfo, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none resize-none"
                  placeholder="Décrivez brièvement votre projet..."
                />
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="rgpd"
                  checked={clientInfo.rgpdConsent}
                  onChange={(e) => setClientInfo({...clientInfo, rgpdConsent: e.target.checked})}
                  className="mt-1 w-4 h-4 text-[#00F5FF] bg-gray-800 border-gray-600 rounded focus:ring-[#00F5FF]"
                  required
                />
                <label htmlFor="rgpd" className="text-sm text-gray-300">
                  J'accepte que mes données soient utilisées pour traiter ma demande. 
                  <a href="#" className="text-[#00F5FF] hover:underline ml-1">
                    Politique de confidentialité
                  </a>
                </label>
              </div>
            </div>
          </div>
          
          {/* Récapitulatif et paiement */}
          <div className="space-y-6">
            {/* Récapitulatif */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-6">Récapitulatif</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Service</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Date</span>
                  <span className="font-semibold">
                    {selectedDate?.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Heure</span>
                  <span className="font-semibold">{selectedSlot?.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Durée</span>
                  <span className="font-semibold">{selectedService?.duration}min</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold gradient-text">{selectedService?.price}€</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Options de paiement */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-6">Paiement</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-[#00F5FF] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="onsite"
                    checked={paymentOption === 'onsite'}
                    onChange={(e) => setPaymentOption(e.target.value as any)}
                    className="text-[#00F5FF]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Paiement sur place</span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Recommandé</span>
                    </div>
                    <p className="text-sm text-gray-400">Payez directement lors du rendez-vous</p>
                  </div>
                  <span className="font-bold">0€</span>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-[#00F5FF] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="deposit"
                    checked={paymentOption === 'deposit'}
                    onChange={(e) => setPaymentOption(e.target.value as any)}
                    className="text-[#00F5FF]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold">Acompte 30%</span>
                    <p className="text-sm text-gray-400">Réservez avec un acompte</p>
                  </div>
                  <span className="font-bold">{Math.round((selectedService?.price || 0) * 0.3)}€</span>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-[#00F5FF] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="full"
                    checked={paymentOption === 'full'}
                    onChange={(e) => setPaymentOption(e.target.value as any)}
                    className="text-[#00F5FF]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold">Paiement intégral</span>
                    <p className="text-sm text-gray-400">Payez maintenant en ligne</p>
                  </div>
                  <span className="font-bold">{selectedService?.price}€</span>
                </label>
              </div>
              
              {paymentOption !== 'onsite' && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-semibold">Paiement sécurisé</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Paiement sécurisé par Stripe avec 3D Secure. Vos données sont chiffrées et protégées.
                  </p>
                </div>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 px-6 py-3 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleBooking}
                disabled={!clientInfo.rgpdConsent || isLoading}
                className="flex-1 btn-primary px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Confirmation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmer le RDV</span>
                    {getPaymentAmount() > 0 && (
                      <span>({getPaymentAmount()}€)</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;