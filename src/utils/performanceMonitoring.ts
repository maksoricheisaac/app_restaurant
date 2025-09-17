// Monitoring des performances en temps réel
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  
  // Mesure du temps de chargement des composants
  measureComponentLoad(componentName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.metrics.set(`component_${componentName}`, loadTime);
    
    if (loadTime > 100) {
      console.warn(`⚠️ Composant lent détecté: ${componentName} (${loadTime.toFixed(2)}ms)`);
    }
  }

  // Mesure des Core Web Vitals
  measureWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.set('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutEntry = entry as any;
        if (!layoutEntry.hadRecentInput) {
          clsValue += layoutEntry.value;
        }
      }
      this.metrics.set('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Rapport de performance
  getPerformanceReport() {
    return {
      metrics: Object.fromEntries(this.metrics),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.get('LCP')! > 2500) {
      recommendations.push('LCP > 2.5s - Optimiser les images et le rendu initial');
    }
    
    if (this.metrics.get('FID')! > 100) {
      recommendations.push('FID > 100ms - Réduire le JavaScript bloquant');
    }
    
    if (this.metrics.get('CLS')! > 0.1) {
      recommendations.push('CLS > 0.1 - Stabiliser la mise en page');
    }
    
    return recommendations;
  }
}

export const performanceMonitor = new PerformanceMonitor();