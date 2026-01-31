/**
 * Urgency Pricing Cache Layer
 *
 * Production-ready Redis caching for urgency pricing calculations
 * Features:
 * - Automatic cache invalidation based on urgency level
 * - Distributed caching support
 * - Cache warming for frequently accessed prices
 * - Fallback to in-memory cache if Redis unavailable
 */

import { createClient, RedisClientType } from 'redis';
import {
  UrgencyPricing,
  UrgencyPricingCacheEntry,
  UrgencyLevel,
  CACHE_TTL,
} from '../types/urgency.types';
import { CacheError } from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * In-memory cache fallback
 */
class MemoryCache {
  private cache: Map<string, UrgencyPricingCacheEntry>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): UrgencyPricingCacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, entry: UrgencyPricingCacheEntry): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class UrgencyPricingCache {
  private redisClient: RedisClientType | null;
  private memoryCache: MemoryCache;
  private logger: Logger;
  private isRedisAvailable: boolean;
  private readonly keyPrefix: string = 'urgency_pricing:';

  constructor(
    redisUrl?: string,
    options?: {
      memoryCacheSize?: number;
      logger?: Logger;
    }
  ) {
    this.logger = options?.logger ?? new Logger('UrgencyPricingCache');
    this.memoryCache = new MemoryCache(options?.memoryCacheSize ?? 1000);
    this.isRedisAvailable = false;
    this.redisClient = null;

    if (redisUrl) {
      this.initializeRedis(redisUrl);
    } else {
      this.logger.warn('Redis URL not provided, using in-memory cache only');
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(redisUrl: string): Promise<void> {
    try {
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis reconnection failed after 10 retries');
              this.isRedisAvailable = false;
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis client error:', err);
        this.isRedisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        this.logger.info('Redis client connected');
        this.isRedisAvailable = true;
      });

      this.redisClient.on('disconnect', () => {
        this.logger.warn('Redis client disconnected');
        this.isRedisAvailable = false;
      });

      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get pricing from cache
   *
   * @param key - Cache key
   * @returns Cached pricing or null
   */
  async get(key: string): Promise<UrgencyPricing | null> {
    const fullKey = this.keyPrefix + key;

    try {
      // Try Redis first
      if (this.isRedisAvailable && this.redisClient) {
        const cached = await this.redisClient.get(fullKey);

        if (cached) {
          const entry: UrgencyPricingCacheEntry = JSON.parse(cached);

          // Check if expired
          if (new Date(entry.expiresAt) > new Date()) {
            // Also update memory cache
            this.memoryCache.set(fullKey, entry);
            return this.deserializePricing(entry.pricing);
          } else {
            // Delete expired entry
            await this.delete(key);
            return null;
          }
        }
      }

      // Fallback to memory cache
      const memEntry = this.memoryCache.get(fullKey);
      if (memEntry) {
        return this.deserializePricing(memEntry.pricing);
      }

      return null;
    } catch (error) {
      this.logger.error('Cache get error:', error);
      // Try memory cache as final fallback
      const memEntry = this.memoryCache.get(fullKey);
      return memEntry ? this.deserializePricing(memEntry.pricing) : null;
    }
  }

  /**
   * Set pricing in cache
   *
   * @param key - Cache key
   * @param pricing - Urgency pricing
   * @param ttlSeconds - TTL in seconds (optional, defaults based on urgency level)
   */
  async set(
    key: string,
    pricing: UrgencyPricing,
    ttlSeconds?: number
  ): Promise<void> {
    const fullKey = this.keyPrefix + key;

    // Determine TTL based on urgency level if not provided
    const ttl = ttlSeconds ?? CACHE_TTL[pricing.urgencyLevel];

    const entry: UrgencyPricingCacheEntry = {
      key: fullKey,
      pricing: this.serializePricing(pricing),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl * 1000),
      ttlSeconds: ttl,
    };

    try {
      // Set in Redis
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.setEx(
          fullKey,
          ttl,
          JSON.stringify(entry)
        );
      }

      // Always set in memory cache
      this.memoryCache.set(fullKey, entry);
    } catch (error) {
      this.logger.error('Cache set error:', error);
      // Fallback to memory cache only
      this.memoryCache.set(fullKey, entry);
    }
  }

  /**
   * Delete pricing from cache
   *
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.keyPrefix + key;

    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(fullKey);
      }
      this.memoryCache.delete(fullKey);
    } catch (error) {
      this.logger.error('Cache delete error:', error);
      this.memoryCache.delete(fullKey);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const keys = await this.redisClient.keys(this.keyPrefix + '*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
      this.memoryCache.clear();
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  async getStats(): Promise<{
    redisAvailable: boolean;
    memoryCacheSize: number;
    redisKeysCount?: number;
  }> {
    let redisKeysCount: number | undefined;

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(this.keyPrefix + '*');
        redisKeysCount = keys.length;
      } catch (error) {
        this.logger.error('Failed to get Redis keys count:', error);
      }
    }

    return {
      redisAvailable: this.isRedisAvailable,
      memoryCacheSize: this.memoryCache.size(),
      redisKeysCount,
    };
  }

  /**
   * Generate cache key for pricing request
   *
   * @param targetDate - Target date
   * @param basePrice - Base price
   * @param steepness - Urgency steepness
   * @param marketMultiplier - Market demand multiplier
   * @returns Cache key
   */
  static generateCacheKey(
    targetDate: Date,
    basePrice: number,
    steepness: number,
    marketMultiplier: number
  ): string {
    const dateKey = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${dateKey}:${basePrice}:${steepness}:${marketMultiplier.toFixed(2)}`;
  }

  /**
   * Serialize pricing for cache storage
   *
   * Converts Date objects to ISO strings
   */
  private serializePricing(pricing: UrgencyPricing): any {
    return {
      ...pricing,
      calculatedAt: pricing.calculatedAt.toISOString(),
      expiresAt: pricing.expiresAt.toISOString(),
      projections: pricing.projections.map(p => ({
        ...p,
        timestamp: p.timestamp.toISOString(),
      })),
    };
  }

  /**
   * Deserialize pricing from cache
   *
   * Converts ISO strings back to Date objects
   */
  private deserializePricing(cached: any): UrgencyPricing {
    return {
      ...cached,
      calculatedAt: new Date(cached.calculatedAt),
      expiresAt: new Date(cached.expiresAt),
      projections: cached.projections.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      })),
    };
  }

  /**
   * Warm cache for frequently accessed prices
   *
   * Pre-calculates and caches prices for common scenarios
   *
   * @param pricingCalculator - Function to calculate pricing
   * @param scenarios - Array of pricing scenarios to warm
   */
  async warmCache(
    pricingCalculator: (
      targetDate: Date,
      basePrice: number,
      steepness: number,
      marketMultiplier: number
    ) => Promise<UrgencyPricing>,
    scenarios: Array<{
      targetDate: Date;
      basePrice: number;
      steepness?: number;
      marketMultiplier?: number;
    }>
  ): Promise<void> {
    this.logger.info(`Warming cache with ${scenarios.length} scenarios`);

    const promises = scenarios.map(async (scenario) => {
      const steepness = scenario.steepness ?? 2.0;
      const marketMultiplier = scenario.marketMultiplier ?? 1.0;

      try {
        const pricing = await pricingCalculator(
          scenario.targetDate,
          scenario.basePrice,
          steepness,
          marketMultiplier
        );

        const key = UrgencyPricingCache.generateCacheKey(
          scenario.targetDate,
          scenario.basePrice,
          steepness,
          marketMultiplier
        );

        await this.set(key, pricing);
      } catch (error) {
        this.logger.error('Cache warming error for scenario:', scenario, error);
      }
    });

    await Promise.all(promises);
    this.logger.info('Cache warming complete');
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.isRedisAvailable = false;
    }
  }
}
