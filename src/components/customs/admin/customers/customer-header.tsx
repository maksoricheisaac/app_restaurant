import { ResponsivePageHeader } from "@/components/ui/responsive-page-header";

interface CustomerHeaderProps {
  onAdd: () => void;
}

export function CustomerHeader({ onAdd }: CustomerHeaderProps) {
  return (
    <ResponsivePageHeader
      title="Clients"
      description="Gérez vos clients et leurs informations"
      buttonText="Nouveau Client"
      buttonTextMobile="Ajouter"
      onButtonClick={onAdd}
    />
  );
}