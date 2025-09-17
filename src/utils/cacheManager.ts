// Gestionnaire de cache pour optimiser les performances
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  // Cache pour les images
  cacheImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cached = this.get(`image_${url}`);
      if (cached) {
        resolve(cached);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.set(`image_${url}`, url, 30 * 60 * 1000); // 30 minutes
        resolve(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Cache pour les données API
  async cacheApiCall<T>(key: string, apiCall: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached) return cached;

    const data = await apiCall();
    this.set(key, data, ttl);
    return data;
  }
}

export const cacheManager = new CacheManager();