/**
 * FORMATTING UTILITIES
 *
 * Helper functions for formatting currency, dates, times, and other data
 * used throughout the bidding interface.
 *
 * @version 1.0.0
 */

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  };

  return amount.toLocaleString('en-US', defaultOptions);
}

/**
 * Format currency with cents
 */
export function formatCurrencyWithCents(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format date (e.g., "Oct 15, 2026")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date with day of week (e.g., "Friday, Oct 15, 2026")
 */
export function formatDateWithDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format time (e.g., "3:45 PM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date and time (e.g., "Oct 15, 2026 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Format relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  if (seconds > 10) {
    return `${seconds} seconds ago`;
  }

  return 'just now';
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format increment (e.g., "+$500" or "-$200")
 */
export function formatIncrement(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${formatCurrency(Math.abs(amount))}`;
}

/**
 * Format bid round (e.g., "Round 1 of 3")
 */
export function formatBidRound(current: number, max: number): string {
  return `Round ${current} of ${max}`;
}

/**
 * Format user name with truncation
 */
export function formatUserName(
  name: string,
  maxLength: number = 20
): string {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength - 3)}...`;
}

/**
 * Format large numbers with suffixes (e.g., "1.5K", "2.3M")
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toString();
}

/**
 * Pluralize word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return singular;
  }

  return plural || `${singular}s`;
}

/**
 * Format bid status
 */
export function formatBidStatus(
  isHighBid: boolean,
  isAutoBid: boolean
): string {
  if (isHighBid && isAutoBid) {
    return 'High Bid (Auto)';
  }

  if (isHighBid) {
    return 'High Bid';
  }

  if (isAutoBid) {
    return 'Auto-Bid';
  }

  return 'Bid';
}

/**
 * Format session status
 */
export function formatSessionStatus(
  status: 'active' | 'completed' | 'expired' | 'cancelled'
): string {
  const statusMap = {
    active: 'Active',
    completed: 'Completed',
    expired: 'Expired',
    cancelled: 'Cancelled'
  };

  return statusMap[status] || status;
}

export default {
  formatCurrency,
  formatCurrencyWithCents,
  formatDate,
  formatDateWithDay,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatPercentage,
  formatIncrement,
  formatBidRound,
  formatUserName,
  formatCompactNumber,
  pluralize,
  formatBidStatus,
  formatSessionStatus
};
