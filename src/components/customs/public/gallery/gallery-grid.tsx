import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface GalleryImage {
  src: string;
  alt: string;
  category: string;
  title: string;
  description: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  viewMode: 'grid' | 'masonry';
  onImageClick: (image: GalleryImage) => void;
}

export function GalleryGrid({ images, viewMode, onImageClick }: GalleryGridProps) {
  return (
    <div
      className={cn(
        'gap-4 sm:gap-6 lg:gap-8',
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'columns-1 sm:columns-2 lg:columns-3 space-y-4 sm:space-y-6 lg:space-y-8'
      )}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            "group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-700 cursor-pointer transform hover:-translate-y-2 bg-white",
            viewMode === 'masonry' && "break-inside-avoid"
          )}
          onClick={() => onImageClick(image)}
        >
          <div
            className={cn(
              "overflow-hidden",
              viewMode === 'grid' ? "aspect-square" : "aspect-auto"
            )}
          >
            <OptimizedImage
              width={1000}
              height={1000}
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center">
            <div className="text-center text-white p-4 sm:p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{image.title}</h3>
              <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">{image.description}</p>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm"
                >
                  <Camera className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                  Voir
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <Badge
              variant="secondary"
              className="bg-white/90 text-gray-700 text-xs font-semibold backdrop-blur-sm"
            >
              {image.category}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
