/**
 * Urgency Calculator
 *
 * Calculates urgency levels and multipliers based on time until check-in.
 * Used for pricing adjustments and UI urgency indicators.
 */

export interface UrgencyResult {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  daysUntil: number;
  multiplier: number;
  color: string;
  label: string;
  message: string;
}

/**
 * Calculate urgency level and multiplier
 */
export function calculateUrgency({
  checkInDate,
  currentDate = new Date()
}: {
  checkInDate: Date;
  currentDate?: Date;
}): UrgencyResult {

  if (!checkInDate) {
    return {
      level: 'LOW',
      daysUntil: 999,
      multiplier: 1.0,
      color: 'green',
      label: 'No Rush',
      message: ''
    };
  }

  // Calculate days until check-in
  const timeDiff = new Date(checkInDate).getTime() - currentDate.getTime();
  const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Handle negative days (past date)
  if (daysUntil < 0) {
    return {
      level: 'CRITICAL',
      daysUntil: 0,
      multiplier: 2.0,
      color: 'red',
      label: 'Overdue',
      message: 'Check-in date has passed'
    };
  }

  // CRITICAL: 0-3 days
  if (daysUntil <= 3) {
    return {
      level: 'CRITICAL',
      daysUntil,
      multiplier: 1.5,  // 50% urgency premium
      color: 'red',
      label: 'Very Urgent',
      message: daysUntil === 0
        ? 'Check-in is today!'
        : daysUntil === 1
        ? 'Check-in is tomorrow!'
        : `Check-in is in ${daysUntil} days! Last-minute changes may incur premium pricing.`
    };
  }

  // HIGH: 4-7 days
  if (daysUntil <= 7) {
    return {
      level: 'HIGH',
      daysUntil,
      multiplier: 1.25,  // 25% urgency premium
      color: 'orange',
      label: 'Urgent',
      message: `Check-in is in ${daysUntil} days. Consider finalizing your plans soon.`
    };
  }

  // MEDIUM: 8-14 days
  if (daysUntil <= 14) {
    return {
      level: 'MEDIUM',
      daysUntil,
      multiplier: 1.1,  // 10% urgency premium
      color: 'yellow',
      label: 'Moderate',
      message: `Check-in is in ${daysUntil} days. You still have time to adjust.`
    };
  }

  // LOW: 15+ days
  return {
    level: 'LOW',
    daysUntil,
    multiplier: 1.0,  // No urgency premium
    color: 'green',
    label: 'No Rush',
    message: `Check-in is in ${daysUntil} days. Plenty of time to plan.`
  };
}

/**
 * Format urgency message for user display
 */
export function formatUrgencyMessage(urgency: UrgencyResult): string {
  return urgency.message;
}

/**
 * Get urgency icon for UI
 */
export function getUrgencyIcon(urgency: UrgencyResult): string {
  const icons: Record<string, string> = {
    'CRITICAL': '🔴',
    'HIGH': '🟠',
    'MEDIUM': '🟡',
    'LOW': '🟢'
  };
  return icons[urgency.level] || '🟢';
}

/**
 * Check if urgency warrants a warning
 */
export function shouldShowUrgencyWarning(urgency: UrgencyResult): boolean {
  return ['CRITICAL', 'HIGH'].includes(urgency.level);
}

/**
 * Get recommended action based on urgency
 */
export function getRecommendedAction(urgency: UrgencyResult): string {
  switch (urgency.level) {
    case 'CRITICAL':
      return 'Book immediately to secure availability';
    case 'HIGH':
      return 'Act soon to avoid higher prices';
    case 'MEDIUM':
      return 'Book within the next few days';
    case 'LOW':
      return 'Take your time to find the best option';
    default:
      return '';
  }
}
