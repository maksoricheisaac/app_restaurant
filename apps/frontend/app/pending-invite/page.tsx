'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, LogOut, Clock, Building2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingInvitePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const accountTypeLabel =
    user?.accountType === 'FRANCHISE'
      ? 'Franchise'
      : user?.accountType === 'MULTI_MANAGER'
        ? 'Multi-restaurants'
        : 'Gestionnaire';

  const AccountIcon = user?.accountType === 'FRANCHISE' ? Network : Building2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-primary/30 transition-shadow">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Flash Menu</span>
        </Link>

        {/* Badge compte */}
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600">
          <AccountIcon className="h-4 w-4" />
          Compte {accountTypeLabel}
        </div>

        {/* Icône principale */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Votre compte est prêt !
          </h1>
          <p className="text-slate-500 leading-relaxed">
            En tant que <span className="font-semibold text-slate-700">{accountTypeLabel.toLowerCase()}</span>,
            vous n&apos;avez pas de restaurant en propre.
            <br />
            Un propriétaire de restaurant doit vous inviter pour que vous puissiez accéder à son espace.
          </p>
        </div>

        {/* Étapes */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 text-left space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Prochaines étapes
          </p>
          {[
            {
              step: '1',
              text: 'Partagez votre email avec le propriétaire du restaurant',
              color: 'bg-orange-500',
            },
            {
              step: '2',
              text: 'Il vous ajoute depuis Réglages → Équipe → Inviter un membre',
              color: 'bg-violet-500',
            },
            {
              step: '3',
              text: 'Reconnectez-vous, le restaurant apparaîtra automatiquement',
              color: 'bg-emerald-500',
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.color} text-white text-xs font-bold`}
              >
                {item.step}
              </div>
              <p className="text-sm text-slate-600 pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Email de contact */}
        {user?.email && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs text-slate-400">Votre email à communiquer</p>
              <p className="text-sm font-semibold text-slate-700 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => router.refresh()}
            className="w-full"
          >
            Actualiser (j&apos;ai été invité)
          </Button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
