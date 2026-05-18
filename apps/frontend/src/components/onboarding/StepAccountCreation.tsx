'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { stepAccountCreationSchema, type StepAccountCreationInput } from '@/schemas/validation';
import { onboardingService } from '@/services/onboarding.service';
import { useAuth } from '@/contexts/AuthContext';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
}

const passwordRequirements = [
  { label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
];

export default function StepAccountCreation({ onNext }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { setUser } = useAuth();

  const form = useForm<StepAccountCreationInput>({
    resolver: zodResolver(stepAccountCreationSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
    mode: 'onChange',
  });

  const password = form.watch('password');

  const onSubmit = async (values: StepAccountCreationInput) => {
    setIsLoading(true);
    setApiError('');
    try {
      const result = await onboardingService.initiate(values);
      setUser(result.user as any);
      onNext({ firstName: values.firstName, lastName: values.lastName, email: values.email });
    } catch (err: any) {
      setApiError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Créez votre compte
        </h1>
        <p className="text-sm text-slate-500">
          Quelques secondes pour commencer votre aventure Flash Menu.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Prénom
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Jean"
                        className="pl-9 h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
                        autoComplete="given-name"
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nom
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dupont"
                      className="h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
                      autoComplete="family-name"
                      {...field}
                    />
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
                <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Adresse email
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="jean@restaurant.fr"
                      className="pl-9 h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
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
                <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mot de passe
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-10 h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
              className="grid grid-cols-2 gap-1.5"
            >
              {passwordRequirements.map((req) => {
                const ok = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        ok ? 'bg-green-500' : 'bg-slate-200'
                      }`}
                    />
                    <span className={`text-[11px] transition-colors ${ok ? 'text-green-600' : 'text-slate-400'}`}>
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
              className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {apiError}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
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
