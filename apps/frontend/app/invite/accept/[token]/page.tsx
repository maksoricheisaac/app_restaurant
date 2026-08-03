'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Store, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useInvitePreview,
  useAcceptInvite,
  useDeclineInvite,
} from '@/hooks/api/useStaff';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  manager: 'Manager',
  waiter: 'Serveur',
  chef: 'Chef',
  cashier: 'Caissier',
};

/**
 * Acceptation d'invitation.
 *
 * C'est le seul chemin de création de compte du logiciel : il n'existe plus
 * d'inscription publique. La personne invitée choisit ici son nom et son mot
 * de passe ; son email et son rôle sont fixés par l'invitation, pas par elle.
 */
export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: invite, isLoading, isError } = useInvitePreview(token);
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [declined, setDeclined] = useState(false);

  const handleAccept = () => {
    if (!name.trim()) return toast.error('Renseignez votre nom.');
    if (password.length < 8) {
      return toast.error('Le mot de passe doit contenir au moins 8 caractères.');
    }

    acceptInvite.mutate(
      { token, name: name.trim(), password },
      {
        onSuccess: () => {
          toast.success('Bienvenue dans l’équipe ! Connectez-vous pour commencer.');
          router.push('/auth/login');
        },
        onError: (err: any) =>
          toast.error(err?.message ?? "Impossible d'accepter l'invitation."),
      },
    );
  };

  const handleDecline = () => {
    declineInvite.mutate(token, { onSuccess: () => setDeclined(true) });
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

        {isLoading && (
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
                : `Cette invitation a déjà été ${
                    invite.status === 'accepted'
                      ? 'acceptée'
                      : invite.status === 'declined'
                        ? 'refusée'
                        : 'annulée'
                  }.`}
            </p>
          </div>
        )}

        {!isLoading && invite && invite.valid && declined && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-slate-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Invitation refusée</h1>
            <p className="text-sm text-slate-500">
              Vous ne rejoindrez pas {invite.restaurantName ?? 'l’équipe'}.
            </p>
          </div>
        )}

        {!isLoading && invite && invite.valid && !declined && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 space-y-6 text-left">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-slate-900">
                Rejoignez {invite.restaurantName ?? 'l’équipe'}
              </h1>
              <p className="text-sm text-slate-500">
                Vous êtes invité(e) en tant que{' '}
                <span className="font-semibold text-slate-700">
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Adresse email</Label>
                <Input value={invite.email} disabled readOnly />
                <p className="text-xs text-slate-400">
                  Fixée par l&apos;invitation — elle ne peut pas être modifiée ici.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Votre nom</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Prénom Nom"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Mot de passe</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAccept}
                disabled={acceptInvite.isPending}
                className="w-full"
              >
                {acceptInvite.isPending ? 'Création du compte…' : 'Rejoindre l’équipe'}
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
          </div>
        )}
      </div>
    </div>
  );
}
