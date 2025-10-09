import { ResponsivePageHeader } from "@/components/ui/responsive-page-header";

interface PageHeaderProps {
  onAddClick: () => void;
}

export function PageHeader({ onAddClick }: PageHeaderProps) {
  return (
    <ResponsivePageHeader
      title="Tables"
      description="Gérez les tables de votre restaurant"
      buttonText="Ajouter une table"
      buttonTextMobile="Ajouter"
      onButtonClick={onAddClick}
    />
  );
}