export const RATE_LIMITS = {
  MINUTE: { window: 'minute', limit: 5 },
  HOUR: { window: 'hour', limit: 20 },
  FAILED_ATTEMPTS: { window: 'minute', limit: 3 } // Limite pour les tentatives échouées
} as const;

export type WindowType = keyof typeof RATE_LIMITS;

// Liste d'IPs en whitelist qui ne seront pas limitées
export const WHITELIST_IPS: string[] = [
  // Exemple : "127.0.0.1"
];

// Durée de conservation des entrées expirées (en heures)
export const CLEANUP_THRESHOLD_HOURS = 24;

// Seuils d'alerte pour la surveillance
export const ALERT_THRESHOLDS = {
  FAILED_ATTEMPTS_PER_IP: 10, // Alerter si une IP échoue plus de 10 fois
  TOTAL_FAILED_ATTEMPTS: 100, // Alerter si le total des échecs dépasse 100
  SUSPICIOUS_IPS: 5 // Nombre d'IPs suspectes avant alerte
}; 