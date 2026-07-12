'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Globe, ArrowRight, ArrowLeft, Loader2, Store, CheckCircle2, XCircle,
  Check, ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { stepRestaurantInfoSchema, type StepRestaurantInfoInput } from '@/schemas/validation';
import { onboardingService } from '@/services/onboarding.service';
import { COUNTRIES, COUNTRY_BY_CODE, flagEmoji, timezoneLabel } from '@/lib/countries';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  data: Partial<OnboardingData>;
}

// Devises courantes proposées en tête ; la devise du pays sélectionné est
// toujours ajoutée à la liste si absente.
const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'XOF', 'XAF', 'MAD', 'TND', 'DZD'];

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
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [countryOpen, setCountryOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<StepRestaurantInfoInput>({
    resolver: zodResolver(stepRestaurantInfoSchema),
    defaultValues: {
      restaurantName: (data.restaurantName as string) || '',
      slug: (data.slug as string) || '',
      country: (data.country as string) || 'FR',
      currency: (data.currency as string) || 'EUR',
      timezone: (data.timezone as string) || 'Europe/Paris',
      cuisineType: (data.cuisineType as string) || '',
    },
    mode: 'onChange',
  });

  const slug = form.watch('slug');
  const country = form.watch('country');
  const selectedCountry = COUNTRY_BY_CODE[country];
  const timezoneOptions = selectedCountry?.timezones ?? [];

  // Devises = courantes + celle du pays sélectionné (dédupliquées).
  const currencyOptions = Array.from(
    new Set([...(selectedCountry ? [selectedCountry.currency] : []), ...COMMON_CURRENCIES]),
  );

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

  // Sélection d'un pays → aligne automatiquement devise + fuseau sur ce pays,
  // et restreint les fuseaux proposés à ceux du pays (exigence produit).
  const onCountrySelect = (code: string) => {
    const c = COUNTRY_BY_CODE[code];
    if (!c) return;
    form.setValue('country', code, { shouldValidate: true });
    form.setValue('currency', c.currency, { shouldValidate: true });
    form.setValue('timezone', c.timezones[0], { shouldValidate: true });
    setCountryOpen(false);
  };

  const onSubmit = (values: StepRestaurantInfoInput) => {
    if (slugStatus === 'taken') return;
    onNext(values as Partial<OnboardingData>);
  };

  const labelCls = 'text-sm font-medium text-foreground';
  const inputCls =
    'h-11 rounded-xl bg-background border-border focus-visible:ring-primary/30 focus-visible:border-primary transition-colors';
  const triggerCls =
    'h-11 rounded-xl bg-background border-border focus:ring-primary/30 focus:border-primary w-full';

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
          Votre restaurant
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces informations configurent votre espace Flash Menu.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom + identifiant sur deux colonnes en desktop pour réduire la hauteur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="restaurantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Nom du restaurant</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="ex : Le Petit Bistro"
                        className={`${inputCls} pl-11`}
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
                  <FormLabel className={labelCls}>
                    Identifiant <span className="text-muted-foreground font-normal">(URL du menu)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="le-petit-bistro"
                        className={`${inputCls} pl-11 pr-11 font-mono text-sm`}
                        {...field}
                        onChange={(e) => field.onChange(slugify(e.target.value))}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {slugStatus === 'taken' && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {slug && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`-mt-1 rounded-xl px-3 py-1.5 text-xs font-mono border ${
                slugStatus === 'available'
                  ? 'bg-success/10 text-success border-success/20'
                  : slugStatus === 'taken'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              {slugStatus === 'taken' ? 'Cet identifiant est déjà pris' : `${slug}.flashmenu.app`}
            </motion.div>
          )}

          {/* Pays (recherche + drapeau) + Cuisine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={labelCls}>Pays</FormLabel>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className={cn(triggerCls, 'justify-between font-normal px-3.5')}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{flagEmoji(field.value)}</span>
                            <span className="truncate">
                              {COUNTRY_BY_CODE[field.value]?.name ?? 'Choisir un pays'}
                            </span>
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un pays…" className="h-10" />
                        <CommandList>
                          <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES.map((c) => (
                              <CommandItem
                                key={c.code}
                                value={c.name}
                                onSelect={() => onCountrySelect(c.code)}
                                className="gap-2"
                              >
                                <span className="text-base leading-none">{flagEmoji(c.code)}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                {field.value === c.code && <Check className="h-4 w-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuisineType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>
                    Cuisine <span className="text-muted-foreground normal-case font-normal">(optionnel)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={triggerCls}>
                        <SelectValue placeholder="Type…" />
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

          {/* Fuseau (filtré par pays) + Devise */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Fuseau horaire</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={triggerCls}>
                        <SelectValue placeholder="Fuseau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezoneOptions.map((tz) => (
                        <SelectItem key={tz} value={tz}>{timezoneLabel(tz)}</SelectItem>
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
                  <FormLabel className={labelCls}>Devise</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={triggerCls}>
                        <SelectValue placeholder="Devise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencyOptions.map((cur) => (
                        <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 px-4 rounded-xl"
              aria-label="Étape précédente"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={slugStatus === 'taken'}
              className="flex-1 h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
