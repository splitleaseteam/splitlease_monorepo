/**
 * Urgency Pricing Backend - Main Application Entry Point
 *
 * Production-ready Express.js application for Pattern 2: Urgency Countdown
 *
 * Features:
 * - RESTful API for urgency pricing calculations
 * - Redis caching layer
 * - PostgreSQL persistence
 * - Background job scheduler
 * - Comprehensive error handling
 * - Request validation and rate limiting
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { UrgencyPricingService } from './api/urgencyPricingService';
import { createUrgencyPricingRoutes, errorHandler } from './api/routes';
import { PriceRecalculationJob, PriceRecalculationScheduler } from './jobs/priceRecalculationJob';
import { UrgencyPricingRepository } from './db/urgencyPricingRepository';
import { getConfig } from './config/config';
import { Logger, LogLevel } from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): {
  app: Application;
  pricingService: UrgencyPricingService;
  scheduler?: PriceRecalculationScheduler;
} {
  const config = getConfig();
  const logger = new Logger('UrgencyPricingApp', LogLevel.INFO);

  logger.info('Starting Urgency Pricing Backend', {
    env: config.env,
    port: config.port,
  });

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  if (config.api.enableCors) {
    app.use(
      cors({
        origin: config.api.corsOrigins,
        credentials: true,
      })
    );
  }

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.api.rateLimitWindowMs,
    max: config.api.rateLimitMaxRequests,
    message: {
      error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip,
      });
    });

    next();
  });

  // Initialize pricing service
  const pricingService = new UrgencyPricingService({
    databaseUrl: config.database.url,
    redisUrl: config.redis.url,
    logger: new Logger('PricingService'),
    enableCaching: config.redis.enableCaching,
    enablePersistence: true,
    defaultSteepness: config.urgency.defaultSteepness,
    defaultLookbackWindow: config.urgency.defaultLookbackWindow,
  });

  // Mount API routes
  app.use('/api/pricing', createUrgencyPricingRoutes({
    pricingService,
    logger: new Logger('PricingAPI'),
  }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'urgency-pricing',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'Urgency Pricing API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
      endpoints: {
        calculate: 'POST /api/pricing/calculate',
        batch: 'POST /api/pricing/batch',
        quick: 'GET /api/pricing/quick',
        calendar: 'POST /api/pricing/calendar',
        events: 'POST /api/pricing/events',
        stats: 'GET /api/pricing/stats',
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Error handler
  app.use(errorHandler);

  // Initialize background job scheduler (if enabled)
  let scheduler: PriceRecalculationScheduler | undefined;

  if (config.jobs.enableScheduler) {
    const repository = new UrgencyPricingRepository(config.database.url, {
      logger: new Logger('Repository'),
    });

    const job = new PriceRecalculationJob({
      pricingService,
      repository,
      logger: new Logger('RecalcJob'),
      batchSize: 50,
      maxRetries: 3,
    });

    scheduler = new PriceRecalculationScheduler(job, new Logger('Scheduler'));
    scheduler.start();

    logger.info('Background job scheduler started');
  }

  return {
    app,
    pricingService,
    scheduler,
  };
}

/**
 * Start server
 */
export async function startServer(): Promise<void> {
  const config = getConfig();
  const logger = new Logger('Server');

  try {
    const { app, pricingService, scheduler } = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`, {
        env: config.env,
        url: `http://localhost:${config.port}`,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Stop accepting new requests
      server.close(async () => {
        logger.info('HTTP server closed');

        // Stop background jobs
        if (scheduler) {
          scheduler.stop();
          logger.info('Background scheduler stopped');
        }

        // Close connections
        await pricingService.close();
        logger.info('Services closed');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
