import { Loader2 } from "lucide-react";

interface TableLoadingProps {
  message?: string;
}

export function TableLoading({ 
  message = "Chargement..." 
}: TableLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
