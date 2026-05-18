import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ResponsiveStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  valueClassName?: string;
}

export function ResponsiveStatCard({
  label,
  value,
  icon: Icon,
  iconBgColor = "bg-orange-100",
  iconColor = "text-orange-600",
  valueClassName = "text-gray-900"
}: ResponsiveStatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 md:pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
              {label}
            </p>
            <p className={`text-lg md:text-2xl font-bold ${valueClassName} truncate`}>
              {value}
            </p>
          </div>
          <div className={`${iconBgColor} p-2 md:p-3 rounded-full flex-shrink-0 ml-2`}>
            <Icon className={`h-4 w-4 md:h-6 md:w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
