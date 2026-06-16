import { Loader2 } from "lucide-react";

export default function TrackLoading() {
  return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-sm text-slate-400 font-medium">Chargement du suivi…</p>
    </div>
  );
}
