/**
 * Events Handler
 *
 * Manage event multipliers (CRUD operations)
 * Admin-only endpoint
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  EventsPayload,
  EventsResponse,
  EventMultiplier,
} from '../types/urgency.types.ts';
import { parseISODate } from '../core/dateUtils.ts';
import { invalidateCacheForDateRange } from '../cache/pricingCache.ts';
import { ValidationError, AuthenticationError } from 'shared/errors.ts';

/**
 * Handle events action
 *
 * Sub-actions: add_event, remove_event, list_events
 *
 * @param payload - Events payload
 * @param user - Authenticated user (admin required)
 * @param supabase - Supabase client
 * @returns Events response
 */
export const handleEvents = async (
  payload: EventsPayload,
  user: any,
  supabase: SupabaseClient
): Promise<EventsResponse> => {
  // Auth check (admin only for add/remove)
  if (payload.action === 'add_event' || payload.action === 'remove_event') {
    if (!user) {
      throw new AuthenticationError('Authentication required for event management');
    }
    // TODO: Add admin role check when role system is implemented
    // if (user.role !== 'admin') {
    //   throw new AuthenticationError('Admin access required');
    // }
  }

  switch (payload.action) {
    case 'add_event':
      return handleAddEvent(payload, supabase);
    case 'remove_event':
      return handleRemoveEvent(payload, supabase);
    case 'list_events':
      return handleListEvents(supabase);
    default:
      throw new ValidationError(`Unknown events action: ${payload.action}`);
  }
};

/**
 * Add event multiplier
 */
const handleAddEvent = async (
  payload: EventsPayload,
  supabase: SupabaseClient
): Promise<EventsResponse> => {
  // Validate required fields
  if (!payload.eventId) {
    throw new ValidationError('eventId is required');
  }
  if (!payload.eventName) {
    throw new ValidationError('eventName is required');
  }
  if (!payload.startDate) {
    throw new ValidationError('startDate is required');
  }
  if (!payload.endDate) {
    throw new ValidationError('endDate is required');
  }
  if (!payload.cities || payload.cities.length === 0) {
    throw new ValidationError('cities array is required');
  }
  if (!payload.multiplier || payload.multiplier < 1.0) {
    throw new ValidationError('multiplier must be >= 1.0');
  }

  const startDate = parseISODate(payload.startDate);
  const endDate = parseISODate(payload.endDate);

  if (endDate < startDate) {
    throw new ValidationError('endDate must be >= startDate');
  }

  // Determine impact level based on multiplier
  let impactLevel: string;
  if (payload.multiplier >= 2.5) {
    impactLevel = 'high';
  } else if (payload.multiplier >= 1.5) {
    impactLevel = 'medium';
  } else {
    impactLevel = 'low';
  }

  // Insert event
  const { data, error } = await supabase
    .from('event_multipliers')
    .insert({
      event_id: payload.eventId,
      event_name: payload.eventName,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      multiplier: payload.multiplier,
      cities: payload.cities,
      impact_level: impactLevel,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add event: ${error.message}`);
  }

  // Invalidate cache for affected date range
  await invalidateCacheForDateRange(supabase, startDate, endDate);

  const event: EventMultiplier = {
    eventId: data.event_id,
    eventName: data.event_name,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    multiplier: parseFloat(data.multiplier),
    cities: data.cities,
  };

  return {
    success: true,
    data: event,
  };
};

/**
 * Remove event multiplier
 */
const handleRemoveEvent = async (
  payload: EventsPayload,
  supabase: SupabaseClient
): Promise<EventsResponse> => {
  if (!payload.eventId) {
    throw new ValidationError('eventId is required');
  }

  // Get event details first (for cache invalidation)
  const { data: event, error: fetchError } = await supabase
    .from('event_multipliers')
    .select('start_date, end_date')
    .eq('event_id', payload.eventId)
    .single();

  if (fetchError || !event) {
    throw new Error(`Event not found: ${payload.eventId}`);
  }

  // Soft delete (set is_active to false)
  const { error: deleteError } = await supabase
    .from('event_multipliers')
    .update({ is_active: false })
    .eq('event_id', payload.eventId);

  if (deleteError) {
    throw new Error(`Failed to remove event: ${deleteError.message}`);
  }

  // Invalidate cache for affected date range
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  await invalidateCacheForDateRange(supabase, startDate, endDate);

  return {
    success: true,
    data: undefined,
  };
};

/**
 * List all active events
 */
const handleListEvents = async (
  supabase: SupabaseClient
): Promise<EventsResponse> => {
  const { data, error } = await supabase
    .from('event_multipliers')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to list events: ${error.message}`);
  }

  const events: EventMultiplier[] = (data || []).map(row => ({
    eventId: row.event_id,
    eventName: row.event_name,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    multiplier: parseFloat(row.multiplier),
    cities: row.cities,
  }));

  return {
    success: true,
    data: events,
  };
};
