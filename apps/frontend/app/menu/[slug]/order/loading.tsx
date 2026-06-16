import { Loader2 } from "lucide-react";

export default function OrderLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4f1] gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      <p className="text-sm text-slate-400 font-medium">Chargement du menu…</p>
    </div>
  );
}
