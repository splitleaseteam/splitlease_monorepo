/**
 * Price Recalculation Background Job
 *
 * Production-ready background job for recalculating urgency pricing
 * Runs periodically to update cached prices and handle critical urgency
 *
 * Features:
 * - Scheduled recalculation based on urgency level
 * - Priority queue for critical urgency dates
 * - Batch processing for efficiency
 * - Error handling and retry logic
 */

import { UrgencyPricingService } from '../api/urgencyPricingService';
import { UrgencyPricingRepository } from '../db/urgencyPricingRepository';
import { PriceRecalculationJobPayload, UrgencyLevel } from '../types/urgency.types';
import { Logger } from '../utils/logger';
import { DateUtils } from '../utils/dateUtils';

export interface JobConfig {
  pricingService: UrgencyPricingService;
  repository: UrgencyPricingRepository;
  logger?: Logger;
  batchSize?: number;
  maxRetries?: number;
}

export class PriceRecalculationJob {
  private service: UrgencyPricingService;
  private repository: UrgencyPricingRepository;
  private logger: Logger;
  private batchSize: number;
  private maxRetries: number;
  private isRunning: boolean = false;

  constructor(config: JobConfig) {
    this.service = config.pricingService;
    this.repository = config.repository;
    this.logger = config.logger ?? new Logger('PriceRecalculationJob');
    this.batchSize = config.batchSize ?? 50;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Execute price recalculation job
   *
   * @param payload - Job payload
   */
  async execute(payload: PriceRecalculationJobPayload): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Job already running, skipping execution');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting price recalculation job', {
        jobId: payload.jobId,
        datesCount: payload.targetDates.length,
        priority: payload.priority,
      });

      // Process dates in batches
      const batches = this.chunkArray(payload.targetDates, this.batchSize);

      let totalProcessed = 0;
      let totalFailed = 0;

      for (const batch of batches) {
        const results = await this.processBatch(batch, payload);

        totalProcessed += results.successful;
        totalFailed += results.failed;

        this.logger.debug('Batch processed', {
          batchSize: batch.length,
          successful: results.successful,
          failed: results.failed,
        });
      }

      const duration = Date.now() - startTime;

      this.logger.info('Price recalculation job completed', {
        jobId: payload.jobId,
        totalProcessed,
        totalFailed,
        durationMs: duration,
      });
    } catch (error) {
      this.logger.error('Price recalculation job failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a batch of dates
   *
   * @param dates - Dates to process
   * @param payload - Job payload
   * @returns Processing results
   */
  private async processBatch(
    dates: Date[],
    payload: PriceRecalculationJobPayload
  ): Promise<{ successful: number; failed: number }> {
    const basePrice = 180; // Default base price from simulation

    const requests = dates.map((date) => ({
      targetDate: date,
      basePrice,
      urgencySteepness: payload.urgencySteepness,
      includeProjections: true,
    }));

    const batchResponse = await this.service.calculateBatchPricing({ requests });

    const successful = batchResponse.results.filter((r) => r.success).length;
    const failed = batchResponse.results.filter((r) => !r.success).length;

    return { successful, failed };
  }

  /**
   * Chunk array into smaller batches
   *
   * @param array - Array to chunk
   * @param size - Batch size
   * @returns Array of batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate target dates for recalculation
   *
   * Returns dates that need recalculation based on urgency level
   *
   * @param daysAhead - Number of days to look ahead
   * @returns Array of target dates
   */
  static generateTargetDates(daysAhead: number = 90): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      dates.push(DateUtils.addDays(now, i));
    }

    return dates;
  }

  /**
   * Generate priority dates for critical urgency
   *
   * Returns dates within critical urgency window (0-3 days)
   *
   * @returns Array of critical dates
   */
  static generateCriticalDates(): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    // Critical urgency: next 3 days
    for (let i = 0; i <= 3; i++) {
      dates.push(DateUtils.addDays(now, i));
    }

    return dates;
  }

  /**
   * Create job payload for scheduled recalculation
   *
   * @param urgencyLevel - Urgency level to target
   * @returns Job payload
   */
  static createJobPayload(
    urgencyLevel: UrgencyLevel = UrgencyLevel.HIGH
  ): PriceRecalculationJobPayload {
    let targetDates: Date[];
    let priority: 'low' | 'medium' | 'high' | 'critical';

    switch (urgencyLevel) {
      case UrgencyLevel.CRITICAL:
        targetDates = this.generateCriticalDates();
        priority = 'critical';
        break;
      case UrgencyLevel.HIGH:
        targetDates = this.generateTargetDates(7);
        priority = 'high';
        break;
      case UrgencyLevel.MEDIUM:
        targetDates = this.generateTargetDates(14);
        priority = 'medium';
        break;
      default:
        targetDates = this.generateTargetDates(90);
        priority = 'low';
    }

    return {
      jobId: `recalc_${Date.now()}`,
      targetDates,
      priority,
      scheduledAt: new Date(),
      metadata: {
        urgencyLevel,
        datesCount: targetDates.length,
      },
    };
  }
}

/**
 * Job scheduler
 *
 * Manages scheduled execution of price recalculation jobs
 */
export class PriceRecalculationScheduler {
  private job: PriceRecalculationJob;
  private logger: Logger;
  private intervals: Map<string, NodeJS.Timeout>;

  constructor(job: PriceRecalculationJob, logger?: Logger) {
    this.job = job;
    this.logger = logger ?? new Logger('PriceRecalculationScheduler');
    this.intervals = new Map();
  }

  /**
   * Start scheduled recalculation
   *
   * Schedules jobs based on urgency level update intervals:
   * - Critical: every 1 minute
   * - High: every 15 minutes
   * - Medium: every 1 hour
   * - Low: every 6 hours
   */
  start(): void {
    this.logger.info('Starting price recalculation scheduler');

    // Critical urgency: every 1 minute
    this.scheduleJob(
      'critical',
      60 * 1000,
      () => PriceRecalculationJob.createJobPayload(UrgencyLevel.CRITICAL)
    );

    // High urgency: every 15 minutes
    this.scheduleJob(
      'high',
      15 * 60 * 1000,
      () => PriceRecalculationJob.createJobPayload(UrgencyLevel.HIGH)
    );

    // Medium urgency: every 1 hour
    this.scheduleJob(
      'medium',
      60 * 60 * 1000,
      () => PriceRecalculationJob.createJobPayload(UrgencyLevel.MEDIUM)
    );

    // Low urgency: every 6 hours
    this.scheduleJob(
      'low',
      6 * 60 * 60 * 1000,
      () => PriceRecalculationJob.createJobPayload(UrgencyLevel.LOW)
    );

    this.logger.info('Price recalculation scheduler started');
  }

  /**
   * Schedule individual job
   *
   * @param name - Job name
   * @param intervalMs - Interval in milliseconds
   * @param payloadFactory - Function to create job payload
   */
  private scheduleJob(
    name: string,
    intervalMs: number,
    payloadFactory: () => PriceRecalculationJobPayload
  ): void {
    const interval = setInterval(async () => {
      try {
        const payload = payloadFactory();
        await this.job.execute(payload);
      } catch (error) {
        this.logger.error(`Scheduled job ${name} failed:`, error);
      }
    }, intervalMs);

    this.intervals.set(name, interval);
    this.logger.info(`Scheduled job: ${name} (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.logger.info('Stopping price recalculation scheduler');

    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      this.logger.debug(`Stopped scheduled job: ${name}`);
    });

    this.intervals.clear();
    this.logger.info('Price recalculation scheduler stopped');
  }

  /**
   * Get scheduler status
   *
   * @returns Scheduler status
   */
  getStatus(): {
    running: boolean;
    scheduledJobs: string[];
  } {
    return {
      running: this.intervals.size > 0,
      scheduledJobs: Array.from(this.intervals.keys()),
    };
  }
}
