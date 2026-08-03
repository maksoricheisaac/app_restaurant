'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/schemas/validation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/customs/public/auth/auth-shell';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirectTo = searchParams.get('redirect') ?? '/admin/dashboard';

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);

      toast.success('Connexion réussie !');
      router.push(redirectTo);
    } catch (err: any) {
      // Afficher le vrai message renvoyé par le backend (email non vérifié, compte suspendu, etc.)
      toast.error(err?.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      panelTitle={<>Le service continue, <span className="font-display-italic text-gradient-warm">sans un temps mort</span>.</>}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight">
          Heureux de vous revoir
        </h1>
        <p className="text-muted-foreground mt-2">
          Connectez-vous pour accéder à votre espace de gestion.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Adresse e-mail</FormLabel>
                <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      className="h-12 pl-11 rounded-xl bg-card"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-foreground">Mot de passe</FormLabel>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <FormControl>
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
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
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-sm text-muted-foreground text-center mt-8">
        Vous faites partie de l’équipe mais n’avez pas encore de compte ?
        Demandez une invitation à votre responsable.
      </p>

      <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
        Accès réservé au personnel du restaurant
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
