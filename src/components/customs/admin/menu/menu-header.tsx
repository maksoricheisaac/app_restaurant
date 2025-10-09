import { ResponsivePageHeader } from "@/components/ui/responsive-page-header";

interface MenuHeaderProps {
  onAdd: () => void;
}

export function MenuHeader({ onAdd }: MenuHeaderProps) {
  return (
    <ResponsivePageHeader
      title="Menu"
      description="Gérez les plats et les boissons de votre menu"
      buttonText="Ajouter un plat"
      buttonTextMobile="Ajouter"
      onButtonClick={onAdd}
    />
  );
} 