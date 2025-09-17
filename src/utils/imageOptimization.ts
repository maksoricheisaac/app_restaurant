// Utilitaires d'optimisation des images
export const imageOptimization = {
  // Lazy loading avec intersection observer
  setupLazyLoading: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  // Génération d'URLs optimisées pour Pexels
  getOptimizedImageUrl: (originalUrl: string, width: number, height?: number, quality: number = 80) => {
    if (!originalUrl || !originalUrl.includes('pexels.com')) return originalUrl;
    
    try {
      const baseUrl = originalUrl.split('?')[0];
      const params = new URLSearchParams();
      params.set('auto', 'compress');
      params.set('cs', 'tinysrgb');
      params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      params.set('dpr', Math.min(window.devicePixelRatio || 1, 2).toString());
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.warn('Erreur lors de l\'optimisation de l\'URL:', error);
      return originalUrl;
    }
  },

  // Préchargement des images critiques
  preloadCriticalImages: (urls: string[]) => {
    urls.forEach(url => {
      if (!url) return;
      
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      } catch (error) {
        console.warn('Erreur lors du préchargement de l\'image:', url, error);
      }
    });
  },

  // Vérification de la validité d'une URL d'image
  isValidImageUrl: (url: string): boolean => {
    if (!url) return false;
    
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    } catch {
      return false;
    }
  }
};