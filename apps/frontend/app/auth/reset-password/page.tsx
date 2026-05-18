'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit faire au moins 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
      .regex(/\d/, 'Doit contenir au moins un chiffre'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-black text-slate-900">Lien invalide</h1>
          <p className="text-slate-500 text-sm">
            Ce lien de réinitialisation est invalide ou manquant.
          </p>
          <Link
            href="/auth/forgot-password"
            className="block text-primary font-bold text-sm hover:underline mt-2"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: { password: string; confirm: string }) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token,
        password: values.password,
      });
      setSuccess(true);
      toast.success('Mot de passe réinitialisé !');
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Lien invalide ou expiré. Demandez un nouveau lien.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/80 text-white shadow-lg shadow-primary/80 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flash Menu</h1>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white pb-6 pt-8">
            <CardTitle className="text-xl font-bold text-center">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription className="text-center">
              Choisissez un mot de passe sécurisé pour votre compte
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-slate-800">
                  Mot de passe mis à jour !
                </p>
                <p className="text-sm text-slate-500">
                  Redirection vers la connexion…
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Nouveau mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary/90 transition-colors" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 border-slate-200 focus-visible:ring-primary/80 bg-slate-50/50"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Confirmer le mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary/90 transition-colors" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 border-slate-200 focus-visible:ring-primary/80 bg-slate-50/50"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary/90 hover:bg-primary text-white font-black h-12 shadow-lg shadow-orange-100"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Réinitialiser le mot de passe'
                    )}
                  </Button>

                  <p className="text-center text-xs text-slate-400">
                    Lien expiré ?{' '}
                    <Link
                      href="/auth/forgot-password"
                      className="text-primary font-bold hover:underline"
                    >
                      Demander un nouveau lien
                    </Link>
                  </p>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
