'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AuthShell } from '@/components/customs/public/auth/auth-shell';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type Status = 'pending' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    fetch(`${API}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage(data.message ?? 'Email vérifié avec succès !');
          setTimeout(() => router.push('/auth/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message ?? 'Lien invalide ou expiré.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Une erreur réseau est survenue.');
      });
  }, [searchParams, router]);

  return (
    <AuthShell
      backHref="/auth/login"
      backLabel="Retour à la connexion"
      panelTitle={<>Encore un instant, <span className="font-display-italic text-gradient-warm">et tout est prêt</span>.</>}
      panelPoints={[
        'Vérification de votre adresse en un clic',
        'Votre espace de gestion vous attend',
        'Support 7j/7 en cas de souci',
      ]}
    >
      <div className="animate-slide-up">
        {status === 'pending' && (
          <div className="flex flex-col items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Vérification en cours…</h1>
              <p className="text-muted-foreground mt-2 text-sm">Merci de patienter quelques secondes.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-success/12 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Email vérifié</h1>
              <p className="text-muted-foreground mt-2 text-sm">{message}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Redirection vers la connexion…</p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/auth/login">Se connecter<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-destructive/12 flex items-center justify-center">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Vérification échouée</h1>
              <p className="text-muted-foreground mt-2 text-sm">{message}</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/auth/register">Créer un nouveau compte</Link>
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
