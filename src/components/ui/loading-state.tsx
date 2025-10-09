import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ 
  message = "Chargement...", 
  fullScreen = false 
}: LoadingStateProps) {
  const containerClass = fullScreen 
    ? "flex items-center justify-center min-h-screen" 
    : "flex items-center justify-center h-96";

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
