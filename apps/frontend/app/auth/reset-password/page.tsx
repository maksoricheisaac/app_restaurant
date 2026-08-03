'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/customs/public/auth/auth-shell';

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
  const [showPwd, setShowPwd] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  if (!token) {
    return (
      <AuthShell
        backHref="/auth/login"
        backLabel="Retour à la connexion"
        panelTitle={<>Sécurité d’abord. <span className="font-display-italic text-gradient-warm">Toujours</span>.</>}
      >
        <div className="flex flex-col items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-destructive/12 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Lien invalide</h1>
            <p className="text-muted-foreground mt-2 text-sm">Ce lien de réinitialisation est invalide ou manquant.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  const onSubmit = async (values: { password: string; confirm: string }) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
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
    <AuthShell
      backHref="/auth/login"
      backLabel="Retour à la connexion"
      panelTitle={<>Un nouveau départ, <span className="font-display-italic text-gradient-warm">en toute sérénité</span>.</>}
      panelPoints={[
        'Chiffrement de bout en bout de vos identifiants',
        'Mot de passe fort exigé (maj, min, chiffre)',
        'Reconnexion immédiate après validation',
      ]}
    >
      {success ? (
        <div className="flex flex-col items-start gap-4 animate-slide-up">
          <div className="h-14 w-14 rounded-2xl bg-success/12 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Mot de passe mis à jour</h1>
            <p className="text-muted-foreground mt-2 text-sm">Redirection vers la connexion…</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight">Nouveau mot de passe</h1>
            <p className="text-muted-foreground mt-2">Choisissez un mot de passe sécurisé pour votre compte.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3" role="alert">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Nouveau mot de passe</FormLabel>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <FormControl>
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="h-12 pl-11 pr-11 rounded-xl bg-card"
                          {...field}
                        />
                      </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Confirmer le mot de passe</FormLabel>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <FormControl>
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="h-12 pl-11 rounded-xl bg-card"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Réinitialiser le mot de passe'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Lien expiré ?{' '}
                <Link href="/auth/forgot-password" className="text-primary font-medium hover:underline">
                  Demander un nouveau lien
                </Link>
              </p>
            </form>
          </Form>
        </>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
