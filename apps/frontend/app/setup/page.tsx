import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { SetupWizard } from './_components/setup-wizard';

export const metadata: Metadata = {
  title: 'Première installation',
  robots: { index: false, follow: false },
};

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

/**
 * Assistant de première installation.
 *
 * Ne s'affiche qu'une fois : dès que l'établissement est créé, cette page
 * renvoie vers la connexion. Côté serveur, la contrainte d'unicité de la table
 * `Restaurant` rend une seconde installation impossible même si quelqu'un
 * appelait l'API directement.
 */
export default async function SetupPage() {
  const status = await fetch(`${API_BASE}/setup/status`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (status && !status.required) {
    redirect('/auth/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <ChefHat className="h-6 w-6 text-primary-foreground" />
        </span>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Mettons votre restaurant en service
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Cinq étapes, une seule fois. Rien n&apos;est enregistré tant que vous
          n&apos;avez pas validé la dernière.
        </p>
      </div>

      <SetupWizard />
    </main>
  );
}
