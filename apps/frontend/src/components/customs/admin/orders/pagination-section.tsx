import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function PaginationSection({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} commandes
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isLoading}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
} 