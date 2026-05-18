import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ResponsivePageHeaderProps {
  title: string;
  description: string;
  buttonText: string;
  buttonTextMobile?: string;
  onButtonClick: () => void;
  buttonClassName?: string;
}

export function ResponsivePageHeader({
  title,
  description,
  buttonText,
  buttonTextMobile,
  onButtonClick,
  buttonClassName = "bg-orange-600 hover:bg-orange-700"
}: ResponsivePageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{title}</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">
          {description}
        </p>
      </div>
      <Button onClick={onButtonClick} className={`${buttonClassName} w-full sm:w-auto cursor-pointer flex-shrink-0`}>
        <Plus className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">{buttonText}</span>
        <span className="sm:hidden">{buttonTextMobile || buttonText}</span>
      </Button>
    </div>
  );
}
