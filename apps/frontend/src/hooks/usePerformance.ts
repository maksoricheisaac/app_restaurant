import { useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitoring';

// Hook pour mesurer les performances des composants
export function usePerformance(componentName: string) {
  const startTimeRef = useRef<number>(null);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current) {
        performanceMonitor.measureComponentLoad(componentName, startTimeRef.current);
      }
    };
  }, [componentName]);
}

// Hook pour précharger les ressources critiques
export function usePreloadResources(resources: string[]) {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2|ttf|otf)$/i)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (resource.match(/\.css$/i)) {
        link.as = 'style';
      } else if (resource.match(/\.js$/i)) {
        link.as = 'script';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }, [resources]);
}

// Hook pour optimiser le rendu des listes
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  useEffect(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = Math.floor(visibleCount * 0.5);
    
    setStartIndex(Math.max(0, startIndex - buffer));
    setEndIndex(Math.min(items.length - 1, startIndex + visibleCount + buffer));
  }, [items.length, itemHeight, containerHeight, startIndex]);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
}