import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ContactCardProps {
  icon: LucideIcon;
  title: string;
  content: string | React.ReactNode;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  actionHref?: string;
}

export default function ContactCard({ 
  icon: Icon, 
  title, 
  content, 
  actionLabel, 
  actionIcon: ActionIcon, 
  actionHref 
}: ContactCardProps) {
  return (
    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
      <CardContent className="p-6 sm:p-8">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center mb-6">
          <Icon className="h-6 sm:h-7 w-6 sm:w-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="text-gray-600 mb-4">{content}</div>
        {actionLabel && actionHref && (
          <Button variant="outline" className="w-full border-2 border-orange-200 text-orange-600 hover:bg-orange-50" asChild>
            <a href={actionHref} target={actionHref.startsWith('http') ? "_blank" : undefined} rel={actionHref.startsWith('http') ? "noopener noreferrer" : undefined}>
              {ActionIcon && <ActionIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />}
              {actionLabel}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 