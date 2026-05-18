import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import Image from 'next/image';

export interface GalleryCardProps {
  image: {
    src: string;
    alt: string;
    category: string;
    title: string;
    description: string;
  };
  onClick: () => void;
  viewMode: 'grid' | 'masonry';
}

export function GalleryCard({ image, onClick, viewMode }: GalleryCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 cursor-pointer transform hover:-translate-y-2 bg-white",
        viewMode === 'masonry' && "break-inside-avoid mb-8"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "overflow-hidden",
        viewMode === 'grid' ? "aspect-square" : "aspect-auto"
      )}>
        <Image
          width={100}
          height={100}
          src={image.src}
          alt={image.alt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center">
        <div className="text-center text-white p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="font-bold text-lg mb-2">{image.title}</h3>
          <p className="text-sm text-gray-200 mb-4">{image.description}</p>
          <div className="flex items-center justify-center space-x-2">
            <Button size="sm" variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
              <Camera className="h-4 w-4 mr-2" />
              Voir
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs font-semibold backdrop-blur-sm">
          {image.category}
        </Badge>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
