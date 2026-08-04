import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { SetupWizard } from './_components/setup-wizard';
import { getSetupStatus } from '@/lib/setup-status';

export const metadata: Metadata = {
  title: 'Première installation',
  robots: { index: false, follow: false },
};

/**
 * Assistant de première installation.
 *
 * Ne s'affiche qu'une fois : dès que le logiciel est installé, cette page
 * renvoie vers la connexion — deuxième filet après la redirection du
 * middleware, pour le cas où ce dernier serait contourné (rendu direct, matcher
 * modifié). Le troisième et dernier filet est côté API : `SetupGuard` répond
 * 403 à toute nouvelle soumission, et l'index unique partiel sur le compte
 * racine rend un second super administrateur impossible même en cas de course.
 *
 * Seule exception : la **reprise**. Si l'établissement est configuré mais que
 * son compte racine a disparu, l'assistant se rouvre pour ce seul compte.
 */
export default async function SetupPage() {
  const status = await getSetupStatus();

  if (status && !status.setupRequired) {
    redirect('/auth/login');
  }

  const recovery = status?.recovery ?? false;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <ChefHat className="h-6 w-6 text-primary-foreground" />
        </span>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {recovery
            ? 'Reprenez la main sur votre logiciel'
            : 'Mettons votre restaurant en service'}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {recovery ? (
            <>
              {status?.restaurantName ?? 'Votre établissement'} est déjà
              configuré. Il ne manque que son compte super administrateur.
            </>
          ) : (
            <>
              Cinq étapes, une seule fois. Rien n&apos;est enregistré tant que
              vous n&apos;avez pas validé la dernière.
            </>
          )}
        </p>
      </div>

      <SetupWizard recovery={recovery} />
    </main>
  );
}
