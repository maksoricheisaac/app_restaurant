import { ResponsivePageHeader } from "@/components/ui/responsive-page-header";

interface CategoryHeaderProps {
  onAdd: () => void;
}

export function CategoryHeader({ onAdd }: CategoryHeaderProps) {
  return (
    <ResponsivePageHeader
      title="Catégories"
      description="Gérez les catégories de votre menu ici"
      buttonText="Ajouter une catégorie"
      buttonTextMobile="Ajouter"
      onButtonClick={onAdd}
    />
  );
}