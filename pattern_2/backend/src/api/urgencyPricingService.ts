/**
 * Urgency Pricing Service
 *
 * Production-ready service layer integrating all urgency pricing components
 * Main entry point for pricing calculations with caching and persistence
 */

import { UrgencyCalculator } from '../core/urgencyCalculator';
import { MarketDemandCalculator } from '../core/marketDemandCalculator';
import { UrgencyPricingCache } from '../cache/urgencyPricingCache';
import { UrgencyPricingRepository } from '../db/urgencyPricingRepository';
import {
  PricingCalculationRequest,
  PricingCalculationResponse,
  BatchPricingRequest,
  BatchPricingResponse,
  UrgencyContext,
  UrgencyPricing,
  URGENCY_CONSTANTS,
} from '../types/urgency.types';
import { UrgencyValidator } from '../utils/validator';
import { DateUtils } from '../utils/dateUtils';
import { Logger } from '../utils/logger';
import { UrgencyError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export interface UrgencyPricingServiceConfig {
  databaseUrl?: string;
  redisUrl?: string;
  logger?: Logger;
  enableCaching?: boolean;
  enablePersistence?: boolean;
  defaultSteepness?: number;
  defaultLookbackWindow?: number;
}

export class UrgencyPricingService {
  private cache: UrgencyPricingCache | null;
  private repository: UrgencyPricingRepository | null;
  private marketDemandCalculator: MarketDemandCalculator;
  private logger: Logger;
  private config: Required<UrgencyPricingServiceConfig>;

  constructor(config: UrgencyPricingServiceConfig = {}) {
    this.logger = config.logger ?? new Logger('UrgencyPricingService');

    this.config = {
      databaseUrl: config.databaseUrl ?? '',
      redisUrl: config.redisUrl ?? '',
      logger: this.logger,
      enableCaching: config.enableCaching ?? true,
      enablePersistence: config.enablePersistence ?? true,
      defaultSteepness: config.defaultSteepness ?? URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
      defaultLookbackWindow:
        config.defaultLookbackWindow ?? URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
    };

    // Initialize cache
    this.cache =
      this.config.enableCaching && this.config.redisUrl
        ? new UrgencyPricingCache(this.config.redisUrl, { logger: this.logger })
        : null;

    // Initialize repository
    this.repository =
      this.config.enablePersistence && this.config.databaseUrl
        ? new UrgencyPricingRepository(this.config.databaseUrl, {
            logger: this.logger,
          })
        : null;

    // Initialize market demand calculator
    this.marketDemandCalculator = MarketDemandCalculator.fromSimulationParams('urban');

    this.logger.info('UrgencyPricingService initialized', {
      caching: this.config.enableCaching,
      persistence: this.config.enablePersistence,
    });
  }

  /**
   * Calculate urgency pricing
   *
   * Main entry point for pricing calculation
   * Handles caching, validation, and persistence
   *
   * @param request - Pricing calculation request
   * @returns Pricing calculation response
   */
  async calculatePricing(
    request: PricingCalculationRequest
  ): Promise<PricingCalculationResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      // Validate request
      const validationResult = UrgencyValidator.validatePricingRequest(request);
      if (!validationResult.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid pricing request',
            details: validationResult.errors,
          },
          metadata: {
            requestId,
            calculatedAt: new Date(),
            cacheHit: false,
            calculationTimeMs: Date.now() - startTime,
          },
        };
      }

      // Sanitize request
      const sanitized = UrgencyValidator.sanitizePricingRequest(request);

      // Generate cache key
      const cacheKey = UrgencyPricingCache.generateCacheKey(
        sanitized.targetDate as Date,
        sanitized.basePrice,
        sanitized.urgencySteepness!,
        sanitized.marketDemandMultiplier!
      );

      // Try cache first
      if (this.cache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for pricing request', { cacheKey });

          return {
            success: true,
            data: cached,
            metadata: {
              requestId,
              calculatedAt: new Date(),
              cacheHit: true,
              calculationTimeMs: Date.now() - startTime,
            },
          };
        }
      }

      // Calculate pricing
      const pricing = await this.performCalculation(sanitized);

      // Cache result
      if (this.cache) {
        await this.cache.set(cacheKey, pricing);
      }

      // Persist result
      if (this.repository) {
        await this.repository.savePricing(pricing, cacheKey);
      }

      return {
        success: true,
        data: pricing,
        metadata: {
          requestId,
          calculatedAt: new Date(),
          cacheHit: false,
          calculationTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('Pricing calculation failed:', error);

      return {
        success: false,
        error: {
          code: error instanceof UrgencyError ? error.code : 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metadata: {
          requestId,
          calculatedAt: new Date(),
          cacheHit: false,
          calculationTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Calculate batch pricing
   *
   * Process multiple pricing requests in parallel
   *
   * @param batchRequest - Batch pricing request
   * @returns Batch pricing response
   */
  async calculateBatchPricing(
    batchRequest: BatchPricingRequest
  ): Promise<BatchPricingResponse> {
    const startTime = Date.now();
    const requestId = batchRequest.requestId ?? uuidv4();

    try {
      // Process all requests in parallel
      const results = await Promise.all(
        batchRequest.requests.map((request) => this.calculatePricing(request))
      );

      const successfulRequests = results.filter((r) => r.success).length;
      const failedRequests = results.filter((r) => !r.success).length;

      return {
        success: true,
        results,
        metadata: {
          requestId,
          totalRequests: batchRequest.requests.length,
          successfulRequests,
          failedRequests,
          totalCalculationTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('Batch pricing calculation failed:', error);

      return {
        success: false,
        results: [],
        metadata: {
          requestId,
          totalRequests: batchRequest.requests.length,
          successfulRequests: 0,
          failedRequests: batchRequest.requests.length,
          totalCalculationTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Perform actual pricing calculation
   *
   * @param request - Sanitized pricing request
   * @returns Urgency pricing
   */
  private async performCalculation(
    request: Required<PricingCalculationRequest>
  ): Promise<UrgencyPricing> {
    const targetDate = request.targetDate as Date;
    const currentDate = request.currentDate || new Date();

    // Calculate time until check-in
    const daysUntilCheckIn = DateUtils.calculateDaysUntil(targetDate, currentDate);
    const hoursUntilCheckIn = DateUtils.calculateHoursUntil(targetDate, currentDate);

    // Calculate market demand multiplier
    const marketDemandMultiplier = this.marketDemandCalculator.calculateMultiplier(
      targetDate
    );

    // Build urgency context
    const context: UrgencyContext = {
      targetDate,
      currentDate,
      daysUntilCheckIn,
      hoursUntilCheckIn,
      basePrice: request.basePrice,
      urgencySteepness: request.urgencySteepness,
      marketDemandMultiplier,
      lookbackWindow: request.lookbackWindow,
      transactionType: request.transactionType,
    };

    // Calculate pricing
    const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

    return pricing;
  }

  /**
   * Get pricing for multiple dates
   *
   * Useful for calendar views
   *
   * @param basePrice - Base price
   * @param dates - Array of dates
   * @param steepness - Urgency steepness (optional)
   * @returns Map of date to pricing
   */
  async getPricingForDates(
    basePrice: number,
    dates: Date[],
    steepness?: number
  ): Promise<Map<string, UrgencyPricing>> {
    const requests: PricingCalculationRequest[] = dates.map((date) => ({
      targetDate: date,
      basePrice,
      urgencySteepness: steepness,
    }));

    const batchResponse = await this.calculateBatchPricing({ requests });

    const pricingMap = new Map<string, UrgencyPricing>();

    batchResponse.results.forEach((response, index) => {
      if (response.success && response.data) {
        const dateKey = dates[index].toISOString().split('T')[0];
        pricingMap.set(dateKey, response.data);
      }
    });

    return pricingMap;
  }

  /**
   * Add event to market demand calculator
   *
   * @param eventName - Event name
   * @param startDate - Start date
   * @param endDate - End date
   * @param cities - Cities affected
   * @param multiplier - Demand multiplier
   */
  async addEvent(
    eventName: string,
    startDate: Date,
    endDate: Date,
    cities: string[],
    multiplier: number
  ): Promise<void> {
    const event = this.marketDemandCalculator.addHighImpactEvent(
      eventName,
      startDate,
      endDate,
      cities,
      [multiplier, multiplier]
    );

    // Persist to database
    if (this.repository) {
      await this.repository.saveEvent({
        event_id: event.eventId,
        event_name: event.eventName,
        start_date: event.startDate,
        end_date: event.endDate,
        multiplier: event.multiplier,
        impact_level: multiplier > 3.0 ? 'high' : multiplier > 2.0 ? 'medium' : 'low',
        cities: event.cities,
        description: null,
        is_active: true,
      });
    }

    this.logger.info('Added event:', { eventName, startDate, endDate, multiplier });
  }

  /**
   * Update market demand calculator configuration
   *
   * @param location - Location type
   */
  setLocationConfig(location: 'urban' | 'resort'): void {
    this.marketDemandCalculator =
      MarketDemandCalculator.fromSimulationParams(location);
    this.logger.info(`Market demand config updated to ${location}`);
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  async getCacheStats(): Promise<any> {
    if (!this.cache) {
      return { enabled: false };
    }

    return this.cache.getStats();
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    if (this.repository) {
      const deletedCount = await this.repository.cleanupExpiredPricing();
      this.logger.info(`Cleaned up ${deletedCount} expired pricing records`);
    }

    if (this.cache) {
      // Cache has automatic expiry via Redis TTL
      this.logger.debug('Cache cleanup handled by Redis TTL');
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.cache) {
      await this.cache.close();
    }

    if (this.repository) {
      await this.repository.close();
    }

    this.logger.info('UrgencyPricingService closed');
  }
}
