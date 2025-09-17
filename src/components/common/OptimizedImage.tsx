"use client"
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 800, 
  height, 
  className = '', 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour lazy loading (seulement si pas prioritaire)
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // URLs optimisées pour différentes tailles
  const getOptimizedUrl = (baseWidth: number) => {
    if (!src.includes('pexels.com')) return src;
    
    const baseUrl = src.split('?')[0];
    const params = new URLSearchParams();
    params.set('auto', 'compress');
    params.set('cs', 'tinysrgb');
    params.set('w', baseWidth.toString());
    if (height) params.set('h', Math.round((height * baseWidth) / width).toString());
    params.set('dpr', '1');
    
    return `${baseUrl}?${params.toString()}`;
  };

  const optimizedSrc = getOptimizedUrl(width);
  const optimizedSrcSet = [
    `${getOptimizedUrl(Math.round(width * 0.5))} ${Math.round(width * 0.5)}w`,
    `${getOptimizedUrl(width)} ${width}w`,
    `${getOptimizedUrl(Math.round(width * 1.5))} ${Math.round(width * 1.5)}w`
  ].join(', ');

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder pendant le chargement */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"
          style={{ aspectRatio: height ? `${width}/${height}` : 'auto' }}
        />
      )}
      
      {/* Image d'erreur */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 flex items-center justify-center"
          style={{ aspectRatio: height ? `${width}/${height}` : 'auto' }}
        >
          <div className="text-gray-400 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Image non disponible</p>
          </div>
        </div>
      )}
      
      {/* Image optimisée */}
      {isInView && (
        <Image
          width={width}
          height={height} // Default
          src={optimizedSrc}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } w-full h-full object-cover`}
          style={{ aspectRatio: height ? `${width}/${height}` : 'auto' }}
        />
      )}
    </div>
  );
}