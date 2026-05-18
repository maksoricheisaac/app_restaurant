'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, ArrowLeft, Loader2, Store, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { stepRestaurantInfoSchema, type StepRestaurantInfoInput } from '@/schemas/validation';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  data: Partial<OnboardingData>;
}

const COUNTRIES = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'BE', label: '🇧🇪 Belgique' },
  { code: 'CH', label: '🇨🇭 Suisse' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'LU', label: '🇱🇺 Luxembourg' },
  { code: 'MA', label: '🇲🇦 Maroc' },
  { code: 'TN', label: '🇹🇳 Tunisie' },
  { code: 'DZ', label: '🇩🇿 Algérie' },
  { code: 'SN', label: '🇸🇳 Sénégal' },
  { code: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
];

const CURRENCIES = [
  { code: 'EUR', label: '€ Euro' },
  { code: 'CHF', label: 'CHF Franc suisse' },
  { code: 'CAD', label: 'CAD Dollar canadien' },
  { code: 'MAD', label: 'MAD Dirham marocain' },
  { code: 'TND', label: 'TND Dinar tunisien' },
  { code: 'DZD', label: 'DZD Dinar algérien' },
  { code: 'XOF', label: 'XOF Franc CFA' },
  { code: 'USD', label: '$ Dollar américain' },
];

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'Europe/Brussels', label: 'Bruxelles (UTC+1/+2)' },
  { value: 'Europe/Zurich', label: 'Zurich (UTC+1/+2)' },
  { value: 'America/Toronto', label: 'Toronto (UTC-5/-4)' },
  { value: 'America/Montreal', label: 'Montréal (UTC-5/-4)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (UTC+1)' },
  { value: 'Africa/Tunis', label: 'Tunis (UTC+1)' },
  { value: 'Africa/Algiers', label: 'Alger (UTC+1)' },
  { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { value: 'Africa/Abidjan', label: 'Abidjan (UTC+0)' },
];

const CUISINE_TYPES = [
  'Française', 'Italienne', 'Japonaise', 'Mexicaine', 'Indienne',
  'Chinoise', 'Libanaise', 'Marocaine', 'Thaïlandaise', 'Américaine',
  'Méditerranéenne', 'Fusion', 'Fast-food', 'Pizzeria', 'Burger',
  'Végétarienne', 'Vegan', 'Seafood', 'Steakhouse', 'Brasserie',
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function StepRestaurantInfo({ onNext, onBack, data }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<StepRestaurantInfoInput>({
    resolver: zodResolver(stepRestaurantInfoSchema),
    defaultValues: {
      restaurantName: (data.restaurantName as string) || '',
      slug: (data.slug as string) || '',
      country: 'FR',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      cuisineType: '',
    },
    mode: 'onChange',
  });

  const slug = form.watch('slug');

  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await onboardingService.checkSlug(slug);
        setSlugStatus(result.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [slug]);

  const onNameChange = (name: string) => {
    form.setValue('restaurantName', name);
    form.setValue('slug', slugify(name), { shouldValidate: true });
  };

  const onSubmit = async (values: StepRestaurantInfoInput) => {
    if (slugStatus === 'taken') return;
    setIsLoading(true);
    setApiError('');
    try {
      await onboardingService.saveRestaurantInfo(values);
      onNext(values as Partial<OnboardingData>);
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
          Votre restaurant
        </h1>
        <p className="text-sm text-slate-500">
          Ces informations configurent votre espace Flash Menu.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nom du restaurant
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="ex: Le Petit Bistro"
                      className="pl-9 h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
                      {...field}
                      onChange={(e) => onNameChange(e.target.value)}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Identifiant unique (slug)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="le-petit-bistro"
                      className="pl-9 pr-9 h-11 border-slate-200 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors font-mono text-sm"
                      {...field}
                      onChange={(e) => {
                        field.onChange(slugify(e.target.value));
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                      {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {slugStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                </FormControl>
                {field.value && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1.5 rounded-lg px-3 py-2 text-xs font-mono ${
                      slugStatus === 'available'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : slugStatus === 'taken'
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}
                  >
                    {slugStatus === 'taken'
                      ? '✗ Ce slug est déjà utilisé'
                      : slugStatus === 'available'
                      ? `✓ ${field.value}.flashmenu.app`
                      : `${field.value}.flashmenu.app`}
                  </motion.div>
                )}
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pays
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-primary/30 focus:border-primary">
                        <SelectValue placeholder="Pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Devise
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-primary/30 focus:border-primary">
                        <SelectValue placeholder="Devise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fuseau horaire
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-primary/30 focus:border-primary">
                        <SelectValue placeholder="Fuseau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuisineType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cuisine <span className="text-slate-300 normal-case font-normal">(optionnel)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-primary/30 focus:border-primary">
                        <SelectValue placeholder="Type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUISINE_TYPES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {apiError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={isLoading || slugStatus === 'taken'}
              className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
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
          </div>
        </form>
      </Form>
    </div>
  );
}
