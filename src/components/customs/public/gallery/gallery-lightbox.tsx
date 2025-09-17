import { X, ArrowRight, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface GalleryImage {
  src: string;
  alt: string;
  category: string;
  title: string;
  description: string;
}

interface GalleryLightboxProps {
  image: GalleryImage | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function GalleryLightbox({ image, onClose, onNext, onPrev }: GalleryLightboxProps) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative max-w-6xl max-h-full w-full">
        {/* Navigation buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 sm:p-3 transition-all duration-300 hover:bg-black/70 group"
        >
          <ArrowRight className="h-6 sm:h-8 w-6 sm:w-8 rotate-180 group-hover:scale-110 transition-transform duration-300" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 sm:p-3 transition-all duration-300 hover:bg-black/70 group"
        >
          <ArrowRight className="h-6 sm:h-8 w-6 sm:w-8 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 sm:p-3 transition-all duration-300 hover:bg-black/70 group"
        >
          <X className="h-6 sm:h-8 w-6 sm:w-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Image */}
        <OptimizedImage
          width={1000}
          height={1000}
          src={image.src}
          alt={image.alt}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl mx-auto"
        />

        {/* Image info */}
        <div className="mt-4 sm:mt-6 text-white">
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mx-auto max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">{image.title}</h3>
            <p className="text-sm sm:text-base text-gray-300 mb-4">{image.description}</p>
            <div className="flex items-center justify-center space-x-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {image.category}
              </Badge>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20 text-xs sm:text-sm">
                  <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                  Télécharger
                </Button>
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20 text-xs sm:text-sm">
                  <Share2 className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
