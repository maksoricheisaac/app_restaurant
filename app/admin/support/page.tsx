'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  MessageSquare,
  Code,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papiers`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Support & Assistance</h1>
        <p className="text-muted-foreground">
          Besoin d&apos;aide ? Contactez le développeur de l&apos;application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Developer Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <CardTitle>Informations du Développeur</CardTitle>
            </div>
            <CardDescription>
              Développeur Full Stack & Créateur de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                RM
              </div>
              <div>
                <h3 className="text-xl font-semibold">Riche Isaac MAKSO</h3>
                <p className="text-sm text-muted-foreground">Développeur Full Stack</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">maksoricheisaac@gmail.com</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('maksoricheisaac@gmail.com', 'Email')}
                      className="h-6 px-2"
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Téléphone</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">+242 05 607 34 56</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('+242056073456', 'Numéro')}
                      className="h-6 px-2"
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Localisation</p>
                  <p className="text-sm text-muted-foreground">Congo</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Réseaux sociaux</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://github.com/maksoricheisaac', '_blank')}
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://linkedin.com/in/maksoricheisaac', '_blank')}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://maksoricheisaac.com', '_blank')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Portfolio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Services */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <CardTitle>Services Proposés</CardTitle>
              </div>
              <CardDescription>
                Assistance technique et développement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Support Technique</p>
                    <p className="text-xs text-muted-foreground">
                      Résolution de bugs et problèmes techniques
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Code className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Nouvelles Fonctionnalités</p>
                    <p className="text-xs text-muted-foreground">
                      Développement de nouvelles fonctionnalités sur mesure
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Wrench className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Maintenance</p>
                    <p className="text-xs text-muted-foreground">
                      Maintenance et mises à jour régulières
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Formation</p>
                    <p className="text-xs text-muted-foreground">
                      Formation et accompagnement des utilisateurs
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comment me contacter ?</CardTitle>
              <CardDescription>
                Choisissez le moyen qui vous convient le mieux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.location.href = 'mailto:maksoricheisaac@gmail.com'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer un email
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open('https://wa.me/242056073456', '_blank')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open('tel: +242 05 607 34 56')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>À propos de l&apos;application</CardTitle>
          <CardDescription>
            Informations sur le système de gestion de restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
              <p className="text-lg font-semibold">Septembre 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Technologies</p>
              <p className="text-lg font-semibold">Next.js, React, Prisma</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Cette application a été développée avec passion par <span className="font-semibold text-foreground">Riche Isaac MAKSO</span>.
              Pour toute question, suggestion ou demande d&apos;amélioration, n&apos;hésitez pas à me contacter via les moyens ci-dessus.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}