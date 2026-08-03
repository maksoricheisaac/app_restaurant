import Link from 'next/link';
import { WARM } from './_lib/theme';
import { StatusBlock } from './_components/states';

export default function MenuNotFound() {
  return (
    <StatusBlock
      title="Restaurant introuvable"
      subtitle="Ce restaurant n'existe pas ou son menu n'est plus disponible."
      action={
        <Link
          href="/"
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: WARM.ink }}
        >
          Retour à l&apos;accueil
        </Link>
      }
    />
  );
}
