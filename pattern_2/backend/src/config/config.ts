/**
 * Configuration Management
 *
 * Production-ready configuration system for urgency pricing
 * Loads from environment variables with sensible defaults
 */

import { UrgencyConfig } from '../types/urgency.types';
import { URGENCY_CONSTANTS, CACHE_TTL, UPDATE_INTERVALS } from '../types/urgency.types';

export interface AppConfig {
  // Server configuration
  port: number;
  env: 'development' | 'production' | 'test';

  // Database configuration
  database: {
    url: string;
    poolSize: number;
    ssl: boolean;
  };

  // Redis configuration
  redis: {
    url: string;
    enableCaching: boolean;
  };

  // Urgency pricing configuration
  urgency: UrgencyConfig;

  // API configuration
  api: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    enableCors: boolean;
    corsOrigins: string[];
  };

  // Background jobs configuration
  jobs: {
    enableScheduler: boolean;
    criticalJobIntervalMs: number;
    highJobIntervalMs: number;
    mediumJobIntervalMs: number;
    lowJobIntervalMs: number;
  };

  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    env: (process.env.NODE_ENV as any) || 'development',

    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/urgency_pricing',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
      ssl: process.env.DB_SSL === 'true',
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      enableCaching: process.env.ENABLE_CACHING !== 'false',
    },

    urgency: {
      defaultSteepness: parseFloat(
        process.env.URGENCY_STEEPNESS || String(URGENCY_CONSTANTS.DEFAULT_STEEPNESS)
      ),
      defaultLookbackWindow: parseInt(
        process.env.URGENCY_LOOKBACK_WINDOW ||
          String(URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW),
        10
      ),
      cacheTTLSeconds: CACHE_TTL,
      updateIntervals: UPDATE_INTERVALS,
      urgencyThresholds: {
        critical: parseInt(process.env.URGENCY_THRESHOLD_CRITICAL || '3', 10),
        high: parseInt(process.env.URGENCY_THRESHOLD_HIGH || '7', 10),
        medium: parseInt(process.env.URGENCY_THRESHOLD_MEDIUM || '14', 10),
      },
      maxMultiplier: parseFloat(
        process.env.URGENCY_MAX_MULTIPLIER ||
          String(URGENCY_CONSTANTS.MAX_MULTIPLIER)
      ),
      minMultiplier: parseFloat(
        process.env.URGENCY_MIN_MULTIPLIER ||
          String(URGENCY_CONSTANTS.MIN_MULTIPLIER)
      ),
    },

    api: {
      rateLimitWindowMs: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS || '60000',
        10
      ),
      rateLimitMaxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        10
      ),
      enableCors: process.env.ENABLE_CORS !== 'false',
      corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['*'],
    },

    jobs: {
      enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
      criticalJobIntervalMs: parseInt(
        process.env.CRITICAL_JOB_INTERVAL_MS || '60000',
        10
      ),
      highJobIntervalMs: parseInt(
        process.env.HIGH_JOB_INTERVAL_MS || '900000',
        10
      ),
      mediumJobIntervalMs: parseInt(
        process.env.MEDIUM_JOB_INTERVAL_MS || '3600000',
        10
      ),
      lowJobIntervalMs: parseInt(
        process.env.LOW_JOB_INTERVAL_MS || '21600000',
        10
      ),
    },

    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: (process.env.LOG_FORMAT as any) || 'text',
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  // Validate database URL
  if (!config.database.url) {
    errors.push('Database URL is required');
  }

  // Validate urgency configuration
  if (config.urgency.defaultSteepness <= 0) {
    errors.push('Urgency steepness must be positive');
  }

  if (config.urgency.defaultLookbackWindow <= 0) {
    errors.push('Urgency lookback window must be positive');
  }

  if (
    config.urgency.minMultiplier < 1.0 ||
    config.urgency.minMultiplier > config.urgency.maxMultiplier!
  ) {
    errors.push('Invalid multiplier range');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration for specific environment
 */
export function getConfig(): AppConfig {
  const config = loadConfig();

  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid configuration: ${validation.errors.join(', ')}`
    );
  }

  return config;
}
