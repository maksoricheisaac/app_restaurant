// Générateur de rapport de performance détaillé
import { performanceMonitor } from './performanceMonitoring';

export class PerformanceReporter {
  private static instance: PerformanceReporter;
  
  static getInstance(): PerformanceReporter {
    if (!PerformanceReporter.instance) {
      PerformanceReporter.instance = new PerformanceReporter();
    }
    return PerformanceReporter.instance;
  }

  // Génération du rapport complet
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      metrics: this.collectMetrics(),
      recommendations: this.generateRecommendations(),
      score: this.calculatePerformanceScore()
    };

    return report;
  }

  private getConnectionInfo() {
    type NetInfo = {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    type NavigatorWithConn = Navigator & {
      connection?: NetInfo;
      mozConnection?: NetInfo;
      webkitConnection?: NetInfo;
    };

    const nav = navigator as NavigatorWithConn;
    const connection: NetInfo | undefined = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  }

  private collectMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const metrics = {
      // Navigation Timing
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Paint Timing
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      
      // Resource Timing
      resources: this.analyzeResources(),
      
      // Custom metrics from our monitor
      customMetrics: performanceMonitor.getPerformanceReport()
    };

    return metrics;
  }

  private analyzeResources() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      slowestResources: [] as Array<{name: string; duration: number; size: number}>,
      resourceTypes: {
        images: 0,
        scripts: 0,
        stylesheets: 0,
        fonts: 0,
        other: 0
      },
      cacheable: 0,
      compressed: 0
    };

    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.requestStart;
      const size = resource.transferSize || 0;
      
      analysis.totalSize += size;
      
      // Catégorisation des ressources
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        analysis.resourceTypes.images++;
      } else if (resource.name.match(/\.js$/i)) {
        analysis.resourceTypes.scripts++;
      } else if (resource.name.match(/\.css$/i)) {
        analysis.resourceTypes.stylesheets++;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        analysis.resourceTypes.fonts++;
      } else {
        analysis.resourceTypes.other++;
      }
      
      // Détection du cache
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        analysis.cacheable++;
      }
      
      // Détection de la compression
      if (resource.encodedBodySize && resource.decodedBodySize) {
        if (resource.encodedBodySize < resource.decodedBodySize) {
          analysis.compressed++;
        }
      }
      
      // Ressources les plus lentes
      if (duration > 1000) { // Plus de 1 seconde
        analysis.slowestResources.push({
          name: resource.name,
          duration: Math.round(duration),
          size: Math.round(size / 1024) // en KB
        });
      }
    });

    // Tri des ressources les plus lentes
    analysis.slowestResources.sort((a, b) => b.duration - a.duration);
    analysis.slowestResources = analysis.slowestResources.slice(0, 10); // Top 10

    return analysis;
  }

  private generateRecommendations() {
    const recommendations: Array<{ priority: string; category: string; issue: string; description: string; solutions: string[] }> = [];
    const metrics = this.collectMetrics();
    
    // Recommandations basées sur FCP
    if (metrics.firstContentfulPaint > 2500) {
      recommendations.push({
        priority: 'high',
        category: 'Loading',
        issue: 'First Contentful Paint trop lent',
        description: `FCP: ${Math.round(metrics.firstContentfulPaint)}ms (objectif: <2.5s)`,
        solutions: [
          'Optimiser les images critiques',
          'Réduire le JavaScript bloquant',
          'Utiliser le préchargement des ressources critiques',
          'Optimiser les polices web'
        ]
      });
    }

    // Recommandations basées sur les ressources
    if (metrics.resources.totalSize > 3 * 1024 * 1024) { // 3MB
      recommendations.push({
        priority: 'medium',
        category: 'Resources',
        issue: 'Taille totale des ressources trop importante',
        description: `Taille totale: ${Math.round(metrics.resources.totalSize / 1024 / 1024)}MB`,
        solutions: [
          'Compresser les images',
          'Minifier CSS et JavaScript',
          'Utiliser la compression gzip/brotli',
          'Implémenter le code splitting'
        ]
      });
    }

    // Recommandations pour les images
    if (metrics.resources.resourceTypes.images > 20) {
      recommendations.push({
        priority: 'medium',
        category: 'Images',
        issue: 'Trop d\'images chargées',
        description: `${metrics.resources.resourceTypes.images} images détectées`,
        solutions: [
          'Implémenter le lazy loading',
          'Utiliser des formats modernes (WebP, AVIF)',
          'Optimiser les tailles d\'images',
          'Utiliser des sprites CSS pour les icônes'
        ]
      });
    }

    // Recommandations pour le cache
    const cacheRatio = metrics.resources.cacheable / metrics.resources.totalResources;
    if (cacheRatio < 0.7) {
      recommendations.push({
        priority: 'low',
        category: 'Caching',
        issue: 'Stratégie de cache insuffisante',
        description: `${Math.round(cacheRatio * 100)}% des ressources sont mises en cache`,
        solutions: [
          'Configurer les en-têtes de cache appropriés',
          'Implémenter un Service Worker',
          'Utiliser un CDN',
          'Optimiser la stratégie de versioning'
        ]
      });
    }

    return recommendations;
  }

  private calculatePerformanceScore() {
    const metrics = this.collectMetrics();
    let score = 100;

    // Pénalités basées sur les métriques
    if (metrics.firstContentfulPaint > 2500) score -= 20;
    if (metrics.firstContentfulPaint > 4000) score -= 20;
    
    if (metrics.domContentLoaded > 3000) score -= 15;
    if (metrics.loadComplete > 5000) score -= 15;
    
    if (metrics.resources.totalSize > 3 * 1024 * 1024) score -= 10;
    if (metrics.resources.slowestResources.length > 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  // Export du rapport en JSON
  exportReport() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Affichage du rapport dans la console
  logReport() {
    const report = this.generateReport();
    
    console.group('🚀 Rapport de Performance - Saveurs d\'Afrique');
    console.log('📊 Score global:', `${report.score}/100`);
    console.log('⏱️ Métriques clés:', {
      'First Contentful Paint': `${Math.round(report.metrics.firstContentfulPaint)}ms`,
      'DOM Content Loaded': `${Math.round(report.metrics.domContentLoaded)}ms`,
      'Load Complete': `${Math.round(report.metrics.loadComplete)}ms`
    });
    console.log('📦 Ressources:', {
      'Total': report.metrics.resources.totalResources,
      'Taille totale': `${Math.round(report.metrics.resources.totalSize / 1024)}KB`,
      'Images': report.metrics.resources.resourceTypes.images,
      'Scripts': report.metrics.resources.resourceTypes.scripts
    });
    
    if (report.recommendations.length > 0) {
      console.group('💡 Recommandations d\'amélioration');
      report.recommendations.forEach(rec => {
        console.log(`${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.issue}`);
        console.log(`   ${rec.description}`);
        rec.solutions.forEach(solution => console.log(`   • ${solution}`));
      });
      console.groupEnd();
    }
    
    console.groupEnd();
    
    return report;
  }
}

// Instance globale
export const performanceReporter = PerformanceReporter.getInstance();

// Auto-génération du rapport après le chargement complet
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceReporter.logReport();
  }, 2000); // Attendre 2 secondes pour que toutes les métriques soient disponibles
});