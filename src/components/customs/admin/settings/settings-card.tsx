import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  onClick?: () => void;
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  buttonText,
  onClick,
}: SettingsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 ml-auto text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {description}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
} 