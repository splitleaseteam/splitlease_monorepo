/**
 * Integration Tests for Urgency Pricing API
 *
 * End-to-end tests for API endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/index';
import { Application } from 'express';
import { UrgencyPricingService } from '../../src/api/urgencyPricingService';

describe('Urgency Pricing API Integration Tests', () => {
  let app: Application;
  let pricingService: UrgencyPricingService;

  beforeAll(() => {
    const appInstance = createApp();
    app = appInstance.app;
    pricingService = appInstance.pricingService;
  });

  afterAll(async () => {
    await pricingService.close();
  });

  describe('GET /health', () => {
    test('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
    });
  });

  describe('POST /api/pricing/calculate', () => {
    test('should calculate pricing for valid request', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          basePrice: 180,
          urgencySteepness: 2.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentPrice');
      expect(response.body.data).toHaveProperty('currentMultiplier');
      expect(response.body.data).toHaveProperty('urgencyLevel');
      expect(response.body.data.currentPrice).toBeGreaterThan(180);
    });

    test('should return error for invalid request', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({
          targetDate: 'invalid-date',
          basePrice: -100,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should return error for date in the past', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({
          targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          basePrice: 180,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should include projections when requested', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          basePrice: 180,
          includeProjections: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.projections).toBeInstanceOf(Array);
      expect(response.body.data.projections.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/pricing/batch', () => {
    test('should calculate batch pricing', async () => {
      const targetDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const targetDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/pricing/batch')
        .send({
          requests: [
            { targetDate: targetDate1.toISOString(), basePrice: 180 },
            { targetDate: targetDate2.toISOString(), basePrice: 180 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results.length).toBe(2);
      expect(response.body.metadata.totalRequests).toBe(2);
      expect(response.body.metadata.successfulRequests).toBe(2);
    });

    test('should reject batch larger than 100 requests', async () => {
      const requests = Array.from({ length: 101 }, (_, i) => ({
        targetDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        basePrice: 180,
      }));

      const response = await request(app)
        .post('/api/pricing/batch')
        .send({ requests });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should handle mixed valid and invalid requests', async () => {
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/pricing/batch')
        .send({
          requests: [
            { targetDate: targetDate.toISOString(), basePrice: 180 },
            { targetDate: 'invalid-date', basePrice: 180 },
            { targetDate: targetDate.toISOString(), basePrice: -100 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(3);

      const successCount = response.body.results.filter(
        (r: any) => r.success
      ).length;
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(3);
    });
  });

  describe('GET /api/pricing/quick', () => {
    test('should calculate quick pricing', async () => {
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/api/pricing/quick')
        .query({
          targetDate: targetDate.toISOString(),
          basePrice: 180,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('multiplier');
      expect(response.body).toHaveProperty('urgencyLevel');
      expect(response.body).toHaveProperty('daysOut');
    });

    test('should return error for missing parameters', async () => {
      const response = await request(app).get('/api/pricing/quick');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/pricing/calendar', () => {
    test('should calculate calendar pricing', async () => {
      const dates = [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ];

      const response = await request(app)
        .post('/api/pricing/calendar')
        .send({
          basePrice: 180,
          dates,
          steepness: 2.0,
        });

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).length).toBe(3);

      dates.forEach((date) => {
        expect(response.body[date]).toBeDefined();
        expect(response.body[date].currentPrice).toBeDefined();
      });
    });

    test('should reject more than 90 dates', async () => {
      const dates = Array.from({ length: 91 }, (_, i) =>
        new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      const response = await request(app)
        .post('/api/pricing/calendar')
        .send({
          basePrice: 180,
          dates,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/pricing/events', () => {
    test('should add event multiplier', async () => {
      const response = await request(app)
        .post('/api/pricing/events')
        .send({
          eventName: 'Test Event',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          cities: ['test-city'],
          multiplier: 2.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return error for missing event data', async () => {
      const response = await request(app)
        .post('/api/pricing/events')
        .send({
          eventName: 'Test Event',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/pricing/stats', () => {
    test('should return cache statistics', async () => {
      const response = await request(app).get('/api/pricing/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cache');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Rate limiting', () => {
    test('should rate limit excessive requests', async () => {
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Make 101 requests (rate limit is 100)
      const requests = Array.from({ length: 101 }, () =>
        request(app)
          .post('/api/pricing/calculate')
          .send({
            targetDate: targetDate.toISOString(),
            basePrice: 180,
          })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 10000); // Increase timeout for this test
  });
});
