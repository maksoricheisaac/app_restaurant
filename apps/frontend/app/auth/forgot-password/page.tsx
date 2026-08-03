'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/customs/public/auth/auth-shell';

const schema = z.object({
  email: z.string().email('Email invalide'),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: { email: string }) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: values.email });
      setSent(true);
    } catch {
      // Always show success to prevent user enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      backHref="/auth/login"
      backLabel="Retour à la connexion"
      panelTitle={<>Un oubli, ça arrive. <span className="font-display-italic text-gradient-warm">On vous rouvre la porte</span>.</>}
      panelPoints={[
        'Un lien sécurisé, valable quelques minutes',
        "Aucune information révélée sur l’existence du compte",
        'Support 7j/7 si vous restez bloqué',
      ]}
    >
      {sent ? (
        <div className="flex flex-col items-start gap-4 animate-slide-up">
          <div className="h-14 w-14 rounded-2xl bg-success/12 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Email envoyé</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation
              dans quelques minutes. Pensez à vérifier vos spams.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight">Mot de passe oublié</h1>
            <p className="text-muted-foreground mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation.
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
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Envoyer le lien<ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-muted-foreground text-center mt-8">
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
