'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { stepAccountCreationSchema, type StepAccountCreationInput } from '@/schemas/validation';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  data: Partial<OnboardingData>;
}

const passwordRequirements = [
  { label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
];

export default function StepAccountCreation({ onNext, data }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm<StepAccountCreationInput>({
    resolver: zodResolver(stepAccountCreationSchema),
    defaultValues: {
      firstName: (data.firstName as string) || '',
      lastName: (data.lastName as string) || '',
      email: (data.email as string) || '',
      password: (data.password as string) || '',
    },
    mode: 'onChange',
  });

  const password = form.watch('password');

  // Aucune écriture en base ici : on vérifie seulement (lecture seule) que
  // l'email n'est pas déjà pris pour donner un retour immédiat, puis on
  // accumule les données du compte dans l'état du wizard. La création réelle
  // du compte n'aura lieu qu'à la toute fin (transaction unique).
  const onSubmit = async (values: StepAccountCreationInput) => {
    setIsLoading(true);
    setApiError('');
    try {
      const { available } = await onboardingService.checkEmail(values.email);
      if (!available) {
        setApiError('Cet email est déjà utilisé');
        return;
      }
      onNext(values);
    } catch (err: any) {
      setApiError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const labelCls = 'text-sm font-medium text-foreground';
  const inputCls =
    'h-11 rounded-xl bg-background border-border focus-visible:ring-primary/30 focus-visible:border-primary transition-colors';

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
          Créez votre compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Quelques secondes pour commencer votre aventure Flash Menu.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Prénom + Nom : pleine largeur chacun sur sa moitié, sans icône pour
              maximiser la place de saisie. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" className={inputCls} autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" className={inputCls} autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Adresse email</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="jean@restaurant.fr"
                      className={`${inputCls} pl-11`}
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Mot de passe</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${inputCls} pl-11 pr-11`}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 border border-border p-3"
            >
              {passwordRequirements.map((req) => {
                const ok = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                        ok ? 'bg-success text-white' : 'bg-border'
                      }`}
                    >
                      {ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    <span className={`text-[11px] transition-colors ${ok ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {apiError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2"
            >
              {apiError}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
