/**
 * Urgency Pricing Repository
 *
 * Production-ready database layer for urgency pricing
 * Handles all database operations for urgency pricing data
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import {
  UrgencyPricing,
  UrgencyPricingRecord,
  MarketDemandRecord,
  EventMultiplierRecord,
  EventMultiplier,
} from '../types/urgency.types';
import { DatabaseError } from '../utils/errors';
import { Logger } from '../utils/logger';

export class UrgencyPricingRepository {
  private pool: Pool;
  private logger: Logger;

  constructor(databaseUrl: string, options?: { logger?: Logger }) {
    this.logger = options?.logger ?? new Logger('UrgencyPricingRepository');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Error handler
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database pool error:', err);
    });
  }

  /**
   * Save urgency pricing to database
   *
   * @param pricing - Urgency pricing
   * @param cacheKey - Cache key
   * @returns Saved record ID
   */
  async savePricing(
    pricing: UrgencyPricing,
    cacheKey: string
  ): Promise<string> {
    const query = `
      INSERT INTO urgency_pricing_cache (
        target_date,
        calculated_at,
        expires_at,
        days_until_checkin,
        hours_until_checkin,
        current_price,
        current_multiplier,
        base_price,
        market_adjusted_base,
        urgency_premium,
        urgency_level,
        increase_rate_per_day,
        increase_rate_per_hour,
        peak_price,
        urgency_steepness,
        market_demand_multiplier,
        projections,
        cache_key
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (cache_key)
      DO UPDATE SET
        current_price = EXCLUDED.current_price,
        current_multiplier = EXCLUDED.current_multiplier,
        calculated_at = EXCLUDED.calculated_at,
        expires_at = EXCLUDED.expires_at,
        projections = EXCLUDED.projections,
        cache_hit_count = urgency_pricing_cache.cache_hit_count + 1,
        updated_at = NOW()
      RETURNING id
    `;

    const values = [
      new Date(pricing.calculatedAt), // Use current time as target date is not directly in pricing
      pricing.calculatedAt,
      pricing.expiresAt,
      pricing.daysUntilCheckIn,
      pricing.hoursUntilCheckIn,
      pricing.currentPrice,
      pricing.currentMultiplier,
      pricing.basePrice,
      pricing.marketAdjustedBase,
      pricing.urgencyPremium,
      pricing.urgencyLevel,
      pricing.increaseRatePerDay,
      pricing.increaseRatePerHour,
      pricing.peakPrice,
      2.0, // Default steepness from simulation
      pricing.marketAdjustedBase / pricing.basePrice, // Infer market multiplier
      JSON.stringify(pricing.projections),
      cacheKey,
    ];

    try {
      const result: QueryResult = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      this.logger.error('Failed to save urgency pricing:', error);
      throw new DatabaseError('Failed to save urgency pricing', error);
    }
  }

  /**
   * Get pricing by cache key
   *
   * @param cacheKey - Cache key
   * @returns Urgency pricing or null
   */
  async getPricingByCacheKey(
    cacheKey: string
  ): Promise<UrgencyPricing | null> {
    const query = `
      SELECT *
      FROM urgency_pricing_cache
      WHERE cache_key = $1
        AND expires_at > NOW()
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [cacheKey]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRecordToPricing(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to get pricing by cache key:', error);
      throw new DatabaseError('Failed to get pricing by cache key', error);
    }
  }

  /**
   * Get pricing history for a date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Max results
   * @returns Array of pricing records
   */
  async getPricingHistory(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<UrgencyPricingRecord[]> {
    const query = `
      SELECT *
      FROM urgency_pricing_cache
      WHERE target_date >= $1
        AND target_date <= $2
      ORDER BY calculated_at DESC
      LIMIT $3
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [
        startDate,
        endDate,
        limit,
      ]);

      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get pricing history:', error);
      throw new DatabaseError('Failed to get pricing history', error);
    }
  }

  /**
   * Clean up expired pricing records
   *
   * @returns Number of deleted records
   */
  async cleanupExpiredPricing(): Promise<number> {
    const query = `SELECT cleanup_expired_urgency_pricing()`;

    try {
      const result: QueryResult = await this.pool.query(query);
      const deletedCount = result.rows[0].cleanup_expired_urgency_pricing;

      this.logger.info(`Cleaned up ${deletedCount} expired pricing records`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired pricing:', error);
      throw new DatabaseError('Failed to cleanup expired pricing', error);
    }
  }

  /**
   * Save market demand multiplier
   *
   * @param demand - Market demand record
   * @returns Saved record ID
   */
  async saveMarketDemand(demand: Omit<MarketDemandRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const query = `
      INSERT INTO market_demand_multipliers (
        date,
        city,
        base_multiplier,
        day_of_week_multiplier,
        seasonal_multiplier,
        event_multiplier,
        total_multiplier,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (date, city)
      DO UPDATE SET
        base_multiplier = EXCLUDED.base_multiplier,
        day_of_week_multiplier = EXCLUDED.day_of_week_multiplier,
        seasonal_multiplier = EXCLUDED.seasonal_multiplier,
        event_multiplier = EXCLUDED.event_multiplier,
        total_multiplier = EXCLUDED.total_multiplier,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING id
    `;

    const values = [
      demand.date,
      demand.city,
      demand.base_multiplier,
      demand.day_of_week_multiplier,
      demand.seasonal_multiplier,
      demand.event_multiplier,
      demand.total_multiplier,
      demand.notes,
    ];

    try {
      const result: QueryResult = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      this.logger.error('Failed to save market demand:', error);
      throw new DatabaseError('Failed to save market demand', error);
    }
  }

  /**
   * Get market demand for a specific date and city
   *
   * @param date - Date
   * @param city - City
   * @returns Market demand record or null
   */
  async getMarketDemand(
    date: Date,
    city: string
  ): Promise<MarketDemandRecord | null> {
    const query = `
      SELECT *
      FROM market_demand_multipliers
      WHERE date = $1 AND city = $2
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [date, city]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      this.logger.error('Failed to get market demand:', error);
      throw new DatabaseError('Failed to get market demand', error);
    }
  }

  /**
   * Save event multiplier
   *
   * @param event - Event multiplier
   * @returns Saved record ID
   */
  async saveEvent(
    event: Omit<EventMultiplierRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const query = `
      INSERT INTO event_multipliers (
        event_id,
        event_name,
        start_date,
        end_date,
        multiplier,
        impact_level,
        cities,
        description,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (event_id)
      DO UPDATE SET
        event_name = EXCLUDED.event_name,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        multiplier = EXCLUDED.multiplier,
        impact_level = EXCLUDED.impact_level,
        cities = EXCLUDED.cities,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING id
    `;

    const values = [
      event.event_id,
      event.event_name,
      event.start_date,
      event.end_date,
      event.multiplier,
      event.impact_level,
      event.cities,
      event.description,
      event.is_active ?? true,
    ];

    try {
      const result: QueryResult = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      this.logger.error('Failed to save event:', error);
      throw new DatabaseError('Failed to save event', error);
    }
  }

  /**
   * Get active events for a date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param city - City (optional)
   * @returns Array of event multipliers
   */
  async getActiveEvents(
    startDate: Date,
    endDate: Date,
    city?: string
  ): Promise<EventMultiplier[]> {
    let query = `
      SELECT *
      FROM event_multipliers
      WHERE is_active = TRUE
        AND start_date <= $2
        AND end_date >= $1
    `;

    const values: any[] = [startDate, endDate];

    if (city) {
      query += ` AND $3 = ANY(cities)`;
      values.push(city);
    }

    query += ` ORDER BY start_date`;

    try {
      const result: QueryResult = await this.pool.query(query, values);

      return result.rows.map(row => ({
        eventId: row.event_id,
        eventName: row.event_name,
        startDate: row.start_date,
        endDate: row.end_date,
        multiplier: parseFloat(row.multiplier),
        cities: row.cities,
      }));
    } catch (error) {
      this.logger.error('Failed to get active events:', error);
      throw new DatabaseError('Failed to get active events', error);
    }
  }

  /**
   * Get configuration value
   *
   * @param key - Configuration key
   * @returns Configuration value or null
   */
  async getConfig(key: string): Promise<any | null> {
    const query = `
      SELECT config_value
      FROM urgency_pricing_config
      WHERE config_key = $1 AND is_active = TRUE
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [key]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].config_value;
    } catch (error) {
      this.logger.error('Failed to get config:', error);
      throw new DatabaseError('Failed to get config', error);
    }
  }

  /**
   * Map database record to UrgencyPricing
   */
  private mapRecordToPricing(record: any): UrgencyPricing {
    return {
      currentPrice: parseFloat(record.current_price),
      currentMultiplier: parseFloat(record.current_multiplier),
      basePrice: parseFloat(record.base_price),
      marketAdjustedBase: parseFloat(record.market_adjusted_base),
      urgencyPremium: parseFloat(record.urgency_premium),
      urgencyLevel: record.urgency_level,
      daysUntilCheckIn: record.days_until_checkin,
      hoursUntilCheckIn: record.hours_until_checkin,
      projections: record.projections ? JSON.parse(record.projections) : [],
      increaseRatePerDay: parseFloat(record.increase_rate_per_day),
      increaseRatePerHour: parseFloat(record.increase_rate_per_hour),
      peakPrice: parseFloat(record.peak_price),
      calculatedAt: new Date(record.calculated_at),
      expiresAt: new Date(record.expires_at),
      cacheKey: record.cache_key,
    };
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
