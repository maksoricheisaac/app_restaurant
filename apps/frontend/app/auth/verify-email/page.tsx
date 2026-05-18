'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center space-y-6">
        {status === 'pending' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
            <p className="text-slate-600 font-medium">Vérification en cours…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-black text-slate-900">Email vérifié !</h1>
            <p className="text-slate-500">{message}</p>
            <p className="text-sm text-slate-400">Redirection vers la connexion…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-black text-slate-900">Vérification échouée</h1>
            <p className="text-slate-500">{message}</p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/auth/register">Créer un nouveau compte</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
