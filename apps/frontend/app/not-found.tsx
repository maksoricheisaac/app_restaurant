import Link from "next/link";
import { Store, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-5 bg-slate-50">
      <Link href="/" className="inline-flex items-center gap-2">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Store className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-900">Flash Menu</span>
      </Link>
      <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
        <Compass className="h-8 w-8 text-slate-300" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800">Page introuvable</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/"
        className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
