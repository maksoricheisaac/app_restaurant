'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Store, Loader2, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  useInvitePreview,
  useAcceptInvite,
  useDeclineInvite,
} from '@/hooks/api/useMemberships';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  manager: 'Manager',
  waiter: 'Serveur',
  head_chef: 'Chef de cuisine',
  chef: 'Cuisinier',
  cashier: 'Caissier',
};

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: invite, isLoading, isError } = useInvitePreview(token);
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();
  const [declined, setDeclined] = useState(false);

  const handleAccept = () => {
    acceptInvite.mutate(token, {
      onSuccess: () => {
        toast.success('Invitation acceptée — bienvenue dans l\'équipe !');
        router.push('/admin/dashboard');
      },
    });
  };

  const handleDecline = () => {
    declineInvite.mutate(token, {
      onSuccess: () => setDeclined(true),
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/auth/login`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-primary/30 transition-shadow">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Flash Menu</span>
        </Link>

        {(isLoading || authLoading) && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Chargement de l&apos;invitation...</p>
          </div>
        )}

        {!isLoading && (isError || !invite) && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Invitation introuvable</h1>
            <p className="text-sm text-slate-500">
              Ce lien d&apos;invitation n&apos;existe pas ou a déjà été utilisé.
            </p>
          </div>
        )}

        {!isLoading && invite && !invite.valid && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
            <XCircle className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">
              {invite.status === 'expired' ? 'Invitation expirée' : 'Invitation non disponible'}
            </h1>
            <p className="text-sm text-slate-500">
              {invite.status === 'expired'
                ? "Ce lien d'invitation a expiré. Demandez à un responsable de vous en renvoyer un."
                : `Cette invitation a déjà été ${invite.status === 'accepted' ? 'acceptée' : invite.status === 'declined' ? 'refusée' : 'annulée'}.`}
            </p>
          </div>
        )}

        {!isLoading && invite && invite.valid && declined && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-slate-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Invitation refusée</h1>
            <p className="text-sm text-slate-500">Vous ne rejoindrez pas {invite.restaurantName}.</p>
          </div>
        )}

        {!isLoading && !authLoading && invite && invite.valid && !declined && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-6 text-left">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-slate-900">
                Rejoignez {invite.restaurantName}
              </h1>
              <p className="text-sm text-slate-500">
                Vous êtes invité(e) en tant que{' '}
                <span className="font-semibold text-slate-700">
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </span>
              </p>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 text-center">
                  Connectez-vous ou créez un compte avec l&apos;adresse{' '}
                  <span className="font-semibold">{invite.email}</span> pour accepter.
                </p>
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login">
                    <Button className="w-full">Se connecter</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" className="w-full">Créer un compte</Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Revenez sur ce lien après connexion pour finaliser.
                </p>
              </div>
            ) : user.email.toLowerCase() !== invite.email.toLowerCase() ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 text-center">
                  Vous êtes connecté(e) en tant que <strong>{user.email}</strong>, mais
                  cette invitation a été envoyée à <strong>{invite.email}</strong>.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter et utiliser un autre compte
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button onClick={handleAccept} disabled={acceptInvite.isPending} className="w-full">
                  {acceptInvite.isPending ? 'Acceptation...' : "Accepter l'invitation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={declineInvite.isPending}
                  className="w-full"
                >
                  Refuser
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
