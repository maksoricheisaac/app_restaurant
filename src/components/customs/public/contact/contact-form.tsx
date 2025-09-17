"use client"
import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAction } from "next-safe-action/hooks";
import { contactAction } from "@/actions/public/contact-action";
import { PhoneInput } from '@/components/ui/phone-input';

const contactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, 'Le message est requis'),
  guests: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    guests: '',
    date: '',
    time: ''
  });

  const { execute, status } = useAction(contactAction, {
    onSuccess: () => {
      toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.", {
        description: "Votre message a été enregistré et sera traité rapidement.",
        duration: 5000,
      });
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', guests: '', date: '', time: ''
      });
    },
    onError: (error) => {
      console.error('Erreur contact form:', error);
      
      // Gestion spécifique des différents types d'erreurs
      if (error.error.validationErrors) {
        // Erreurs de validation
        const firstError = Object.values(error.error.validationErrors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          toast.error(firstError[0], {
            description: "Veuillez corriger les erreurs dans le formulaire.",
            duration: 5000,
          });
        } else {
          toast.error("Erreur de validation du formulaire", {
            description: "Veuillez vérifier que tous les champs sont correctement remplis.",
            duration: 5000,
          });
        }
      } else if (error.error.serverError) {
        // Erreur serveur
        toast.error(error.error.serverError, {
          description: "Une erreur s'est produite côté serveur. Veuillez réessayer.",
          duration: 5000,
        });
      } else if (error.error.thrownError) {
        // Erreur de réseau
        toast.error("Erreur de connexion", {
          description: "Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.",
          duration: 5000,
        });
      } else {
        // Erreur générique
        toast.error("Erreur lors de l'envoi du message", {
          description: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
          duration: 5000,
        });
      }
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Veuillez remplir tous les champs obligatoires';
      toast.info(msg, {
        description: "Veuillez corriger les erreurs avant d'envoyer le message.",
        duration: 4000,
      });
      return false;
    }
    // Validation additionnelle pour réservation
    if (formData.subject === 'reservation') {
      if (!formData.guests) {
        toast.info('Nombre de personnes requis', {
          description: "Veuillez sélectionner le nombre de personnes pour votre réservation.",
          duration: 4000,
        });
        return false;
      }
      if (!formData.date) {
        toast.info('Date requise', {
          description: "Veuillez sélectionner une date pour votre réservation.",
          duration: 4000,
        });
        return false;
      }
      if (!formData.time) {
        toast.info('Heure requise', {
          description: "Veuillez sélectionner une heure pour votre réservation.",
          duration: 4000,
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Afficher un toast de chargement
    toast.loading("Envoi du message en cours...", {
      duration: 0,
    });
    
    try {
      await execute(formData);
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error);
      toast.dismiss(); // Fermer le toast de chargement
    }
  };

  return (
    <Card className="shadow-2xl border-0 bg-white order-2 lg:order-1">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 w-fit">
          <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5" />
          <span className="text-xs sm:text-sm font-semibold">Formulaire de Contact</span>
        </div>
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Envoyez-nous un Message
        </CardTitle>
        <p className="text-base sm:text-lg text-gray-600">
          Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 mb-2 block">Prénom *</Label>
              <Input 
                id="firstName" 
                type="text" 
                required 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 mb-2 block">Nom *</Label>
              <Input 
                id="lastName" 
                type="text" 
                required 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">Téléphone</Label>
            <PhoneInput 
              id="phone" 
              type="tel" 
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 mb-2 block">Sujet</Label>
            <Select value={formData.subject || ""} onValueChange={(value) => handleInputChange('subject', value)}>
              <SelectTrigger className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl w-full">
                <SelectValue placeholder="Choisissez un sujet..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Choisissez un sujet...</SelectItem>
                <SelectItem value="reservation">Réservation de table</SelectItem>
                <SelectItem value="event">Événement privé</SelectItem>
                <SelectItem value="menu">Question sur le menu</SelectItem>
                <SelectItem value="feedback">Commentaire/Suggestion</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reservation specific fields */}
          {formData.subject === 'reservation' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-xl">
              <div>
                <Label htmlFor="guests" className="text-sm font-semibold text-gray-700 mb-2 block">Nombre de personnes</Label>
                <Select value={formData.guests || ""} onValueChange={(value) => handleInputChange('guests', value)}>
                  <SelectTrigger className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                    <SelectValue placeholder="Personnes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sélectionner...</SelectItem>
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} personne{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                    <SelectItem value="10+">Plus de 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 block">Date souhaitée</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-semibold text-gray-700 mb-2 block">Heure souhaitée</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="h-10 sm:h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 block">Message *</Label>
            <Textarea 
              id="message" 
              required 
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="min-h-[120px] border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl" 
            />
          </div>

          <Button 
            type="submit" 
            disabled={status === 'executing'}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 sm:py-4 text-base sm:text-lg rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'executing' ? (
              <>
                <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white"></div>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>Envoyer le message</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 