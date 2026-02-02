/**
 * Urgency Pricing API Routes
 *
 * Production-ready REST API endpoints for urgency pricing
 * Built with Express.js
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UrgencyPricingService } from './urgencyPricingService';
import { PricingCalculationRequest, BatchPricingRequest } from '../types/urgency.types';
import { Logger } from '../utils/logger';

export interface ApiConfig {
  pricingService: UrgencyPricingService;
  logger?: Logger;
  enableRateLimiting?: boolean;
}

export function createUrgencyPricingRoutes(config: ApiConfig): Router {
  const router = Router();
  const logger = config.logger ?? new Logger('UrgencyPricingAPI');
  const pricingService = config.pricingService;

  /**
   * POST /api/pricing/calculate
   *
   * Calculate urgency pricing for a single request
   *
   * Request body:
   * {
   *   "targetDate": "2026-02-15T00:00:00Z",
   *   "basePrice": 180,
   *   "urgencySteepness": 2.0,
   *   "marketDemandMultiplier": 1.0,
   *   "includeProjections": true
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "data": { ...urgencyPricing },
   *   "metadata": { ...metadata }
   * }
   */
  router.post(
    '/calculate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const request: PricingCalculationRequest = req.body;

        logger.debug('Received pricing calculation request:', request);

        const response = await pricingService.calculatePricing(request);

        if (!response.success) {
          return res.status(400).json(response);
        }

        res.json(response);
      } catch (error) {
        logger.error('Error in /calculate endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/pricing/batch
   *
   * Calculate urgency pricing for multiple requests
   *
   * Request body:
   * {
   *   "requests": [
   *     { "targetDate": "2026-02-15", "basePrice": 180 },
   *     { "targetDate": "2026-02-16", "basePrice": 180 }
   *   ]
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "results": [...],
   *   "metadata": { ...metadata }
   * }
   */
  router.post(
    '/batch',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const batchRequest: BatchPricingRequest = req.body;

        logger.debug('Received batch pricing request:', {
          count: batchRequest.requests?.length,
        });

        if (!batchRequest.requests || !Array.isArray(batchRequest.requests)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'requests must be an array',
            },
          });
        }

        if (batchRequest.requests.length > 100) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'BATCH_TOO_LARGE',
              message: 'Batch size limited to 100 requests',
            },
          });
        }

        const response = await pricingService.calculateBatchPricing(batchRequest);

        res.json(response);
      } catch (error) {
        logger.error('Error in /batch endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/pricing/quick
   *
   * Quick pricing calculation with minimal parameters
   *
   * Query params:
   * - targetDate: ISO date string (required)
   * - basePrice: number (required)
   * - steepness: number (optional, default: 2.0)
   *
   * Response:
   * {
   *   "price": 810,
   *   "multiplier": 4.5,
   *   "urgencyLevel": "HIGH",
   *   "daysOut": 7
   * }
   */
  router.get(
    '/quick',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { targetDate, basePrice, steepness } = req.query;

        if (!targetDate || !basePrice) {
          return res.status(400).json({
            error: 'targetDate and basePrice are required',
          });
        }

        const request: PricingCalculationRequest = {
          targetDate: new Date(targetDate as string),
          basePrice: parseFloat(basePrice as string),
          urgencySteepness: steepness ? parseFloat(steepness as string) : undefined,
          includeProjections: false,
        };

        const response = await pricingService.calculatePricing(request);

        if (!response.success || !response.data) {
          return res.status(400).json(response);
        }

        // Return simplified response
        res.json({
          price: response.data.currentPrice,
          multiplier: response.data.currentMultiplier,
          urgencyLevel: response.data.urgencyLevel,
          daysOut: response.data.daysUntilCheckIn,
          calculatedAt: response.data.calculatedAt,
        });
      } catch (error) {
        logger.error('Error in /quick endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/pricing/calendar
   *
   * Get pricing for multiple dates (calendar view)
   *
   * Request body:
   * {
   *   "basePrice": 180,
   *   "dates": ["2026-02-15", "2026-02-16", "2026-02-17"],
   *   "steepness": 2.0
   * }
   *
   * Response:
   * {
   *   "2026-02-15": { ...pricing },
   *   "2026-02-16": { ...pricing },
   *   "2026-02-17": { ...pricing }
   * }
   */
  router.post(
    '/calendar',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { basePrice, dates, steepness } = req.body;

        if (!basePrice || !dates || !Array.isArray(dates)) {
          return res.status(400).json({
            error: 'basePrice and dates array are required',
          });
        }

        if (dates.length > 90) {
          return res.status(400).json({
            error: 'Maximum 90 dates per request',
          });
        }

        const parsedDates = dates.map((d: string) => new Date(d));
        const pricingMap = await pricingService.getPricingForDates(
          basePrice,
          parsedDates,
          steepness
        );

        // Convert Map to object
        const result: Record<string, any> = {};
        pricingMap.forEach((pricing, dateKey) => {
          result[dateKey] = pricing;
        });

        res.json(result);
      } catch (error) {
        logger.error('Error in /calendar endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/pricing/events
   *
   * Add event multiplier
   *
   * Request body:
   * {
   *   "eventName": "AWS re:Invent 2026",
   *   "startDate": "2026-11-30",
   *   "endDate": "2026-12-04",
   *   "cities": ["las-vegas"],
   *   "multiplier": 3.5
   * }
   */
  router.post(
    '/events',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { eventName, startDate, endDate, cities, multiplier } = req.body;

        if (!eventName || !startDate || !endDate || !cities || !multiplier) {
          return res.status(400).json({
            error: 'eventName, startDate, endDate, cities, and multiplier are required',
          });
        }

        await pricingService.addEvent(
          eventName,
          new Date(startDate),
          new Date(endDate),
          cities,
          multiplier
        );

        res.json({
          success: true,
          message: 'Event added successfully',
        });
      } catch (error) {
        logger.error('Error in /events endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/pricing/stats
   *
   * Get cache and service statistics
   */
  router.get(
    '/stats',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const stats = await pricingService.getCacheStats();

        res.json({
          cache: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error in /stats endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/pricing/cleanup
   *
   * Trigger cache cleanup (admin only)
   */
  router.post(
    '/cleanup',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await pricingService.cleanupExpiredCache();

        res.json({
          success: true,
          message: 'Cache cleanup completed',
        });
      } catch (error) {
        logger.error('Error in /cleanup endpoint:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/pricing/health
   *
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'urgency-pricing',
    });
  });

  return router;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const logger = new Logger('ErrorHandler');
  logger.error('API Error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
}
