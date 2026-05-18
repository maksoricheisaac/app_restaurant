/**
 * Utilitaires pour la validation et le formatage des dates
 */

export interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

/**
 * Valide une plage de dates
 */
export function validateDateRange(startDate: Date | undefined, endDate: Date | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!startDate && !endDate) {
    return { isValid: true };
  }

  if (startDate && endDate) {
    if (startDate > endDate) {
      return {
        isValid: false,
        error: "La date de début ne peut pas être postérieure à la date de fin"
      };
    }

    // Vérifier que la plage ne dépasse pas 1 an
    const oneYearFromStart = new Date(startDate);
    oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
    
    if (endDate > oneYearFromStart) {
      return {
        isValid: false,
        error: "La plage de dates ne peut pas dépasser 1 an"
      };
    }
  }

  return { isValid: true };
}

/**
 * Formate une date pour l'affichage
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formate une plage de dates pour l'affichage
 */
export function formatDateRangeForDisplay(startDate: Date | undefined, endDate: Date | undefined): string {
  if (!startDate && !endDate) {
    return "Toutes les dates";
  }

  if (startDate && endDate) {
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDateForDisplay(startDate);
    }
    return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
  }

  if (startDate) {
    return `À partir du ${formatDateForDisplay(startDate)}`;
  }

  if (endDate) {
    return `Jusqu'au ${formatDateForDisplay(endDate)}`;
  }

  return "Toutes les dates";
}

/**
 * Convertit une date en format ISO pour l'API
 */
export function toISOString(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

/**
 * Crée une plage de dates pour aujourd'hui
 */
export function getTodayRange(): DateRange {
  const today = new Date();
  return {
    startDate: today,
    endDate: today
  };
}

/**
 * Crée une plage de dates pour cette semaine
 */
export function getThisWeekRange(): DateRange {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startDate: startOfWeek,
    endDate: endOfWeek
  };
}

/**
 * Crée une plage de dates pour ce mois
 */
export function getThisMonthRange(): DateRange {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return {
    startDate: startOfMonth,
    endDate: endOfMonth
  };
} 