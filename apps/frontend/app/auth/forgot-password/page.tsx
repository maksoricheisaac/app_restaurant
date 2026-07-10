'use client';

import { useState } from 'react';
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
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/80 text-white shadow-lg shadow-primary/80 mb-4">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flash Menu</h1>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white pb-6 pt-8">
            <CardTitle className="text-xl font-bold text-center">
              Mot de passe oublié
            </CardTitle>
            <CardDescription className="text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-slate-800">Email envoyé !</p>
                <p className="text-sm text-slate-500">
                  Si un compte existe avec cet email, vous recevrez un lien de
                  réinitialisation dans quelques minutes. Pensez à vérifier vos
                  spams.
                </p>
                <Link
                  href="/auth/login"
                  className="text-sm text-primary font-bold hover:underline mt-2"
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary/90 transition-colors" />
                            <Input
                              type="email"
                              placeholder="votre@email.com"
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
                      'Envoyer le lien'
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>

          {!sent && (
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-center py-6">
              <Link
                href="/auth/login"
                className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Retour à la connexion
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
