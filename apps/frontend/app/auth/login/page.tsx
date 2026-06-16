'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/schemas/validation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const isOnboarding = searchParams.get('onboarding') === '1';

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
      const loggedUser = await login(values.email, values.password);

      toast.success('Connexion réussie !');

      if (loggedUser.platformRole === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else if (!loggedUser.onboardingCompleted && !loggedUser.tenantId) {
        router.push('/auth/register');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      // Afficher le vrai message renvoyé par le backend (email non vérifié, compte suspendu, etc.)
      toast.error(err?.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/80 text-white shadow-lg shadow-primary/80 mb-4 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flash Menu</h1>
          <p className="text-slate-500 font-medium italic">
            {isOnboarding
              ? 'Connectez-vous pour finaliser la configuration'
              : 'Accédez à votre espace de gestion'}
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-white pb-8 pt-8">
            <CardTitle className="text-xl font-bold text-center">Heureux de vous revoir</CardTitle>
            <CardDescription className="text-center">Connectez-vous pour continuer</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary/90 transition-colors" />
                          <Input
                            placeholder="votre@email.com"
                            className="pl-10 border-slate-200 focus-visible:ring-primary/80 bg-slate-50/50 group-hover:bg-white transition-all"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe</FormLabel>
                        <Link href="/auth/forgot-password" className="text-[10px] font-bold text-primary/90 hover:text-primary transition-colors">Oublié ?</Link>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary/90 transition-colors" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 border-slate-200 focus-visible:ring-primary/80 bg-slate-50/50 group-hover:bg-white transition-all"
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
                  className="w-full bg-primary/90 hover:bg-primary text-white font-black h-12 shadow-lg shadow-orange-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Se Connecter
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4 py-6">
            <p className="text-xs text-slate-500 text-center font-medium">
              Pas encore de restaurant ?{' '}
              <Link href="/auth/register" className="text-primary/90 font-bold hover:underline">
                Créer un compte
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-[10px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Flash Menu SaaS. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
