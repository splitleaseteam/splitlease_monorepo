/**
 * Shared Supabase Client Factory
 * Split Lease - Supabase Edge Functions
 *
 * Centralizes Supabase client creation and authentication patterns.
 * Eliminates ~30-50 lines of boilerplate per edge function.
 *
 * Usage:
 *   import { createClients, authenticateRequest } from '../_shared/supabaseClient.ts';
 *
 *   const { admin, config } = createClients();
 *   const authResult = await authenticateRequest(req.headers, config);
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Result, ok, err } from './functional/result.ts';
import { AuthenticationError } from './errors.ts';
import { corsHeaders } from './cors.ts';
import {
  getSupabaseConfig,
  type SupabaseConfig,
} from './functional/orchestration.ts';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  /** Platform user ID (id from public.user table) */
  readonly id: string;
  /** User's email address */
  readonly email: string;
  /** Supabase Auth UUID (from JWT) */
  readonly supabaseAuthId?: string;
  /** Legacy platform ID from user_metadata */
  readonly legacyPlatformId?: string;
}

/**
 * Client set returned by createClients()
 */
export interface SupabaseClients {
  /** Service role client — bypasses RLS */
  readonly admin: SupabaseClient;
  /** Supabase environment configuration */
  readonly config: SupabaseConfig;
}

/**
 * Options for authenticateRequest()
 */
export interface AuthOptions {
  /** If true, return null instead of error when no auth found */
  readonly optional?: boolean;
  /** If true, also support user_id in payload (legacy auth) */
  readonly allowLegacyFallback?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Client Factories
// ─────────────────────────────────────────────────────────────

/**
 * Create a service role client (admin privileges, bypasses RLS).
 * Use for internal operations that need full database access.
 */
export function createServiceClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Create an anon client with Authorization header.
 * Use for user-authenticated operations that respect RLS.
 */
export function createAuthClient(
  config: SupabaseConfig,
  authHeader: string
): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

/**
 * Create both admin client and config in one call.
 * Throws if required environment variables are missing.
 *
 * @example
 *   const { admin: supabase, config } = createClients();
 */
export function createClients(): SupabaseClients {
  const configResult = getSupabaseConfig();
  if (!configResult.ok) {
    throw configResult.error;
  }
  const config = configResult.value;
  return {
    admin: createServiceClient(config),
    config,
  };
}

// ─────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────

/**
 * Authenticate a request from headers.
 *
 * Supports:
 * 1. JWT token in Authorization header (modern auth)
 * 2. Optional: user_id in payload (legacy fallback)
 *
 * @param headers - Request headers
 * @param config - Supabase configuration
 * @param payload - Optional payload for legacy auth lookup
 * @param options - Authentication options
 * @returns Result with AuthenticatedUser or error
 *
 * @example
 *   // Required auth
 *   const authResult = await authenticateRequest(req.headers, config);
 *   if (!authResult.ok) throw authResult.error;
 *   const user = authResult.value;
 *
 * @example
 *   // Optional auth
 *   const authResult = await authenticateRequest(req.headers, config, undefined, { optional: true });
 *   const user = authResult.ok ? authResult.value : null;
 *
 * @example
 *   // With legacy fallback (messages)
 *   const authResult = await authenticateRequest(req.headers, config, payload, { allowLegacyFallback: true });
 */
export async function authenticateRequest(
  headers: Headers,
  config: SupabaseConfig,
  payload?: Record<string, unknown>,
  options: AuthOptions = {}
): Promise<Result<AuthenticatedUser | null, AuthenticationError>> {
  const { optional = false, allowLegacyFallback = false } = options;

  const authHeader = headers.get('Authorization');

  // Method 1: JWT token in Authorization header
  if (authHeader) {
    const result = await authenticateWithJWT(authHeader, config);
    if (result) {
      return ok(result);
    }
  }

  // Method 2: Legacy auth via user_id in payload
  if (allowLegacyFallback && payload?.user_id) {
    const result = await authenticateWithLegacyId(
      payload.user_id as string,
      config
    );
    if (result) {
      return ok(result);
    }
  }

  // No valid auth found
  if (optional) {
    return ok(null);
  }

  return err(new AuthenticationError(
    'Invalid or expired authentication token. Please log in again.'
  ));
}

// ─────────────────────────────────────────────────────────────
// Internal Auth Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Authenticate using JWT token from Authorization header.
 * Creates an anon client, validates the JWT, then looks up the platform user.
 */
async function authenticateWithJWT(
  authHeader: string,
  config: SupabaseConfig
): Promise<AuthenticatedUser | null> {
  try {
    const authClient = createAuthClient(config, authHeader);
    const { data: { user }, error } = await authClient.auth.getUser();

    if (error || !user) {
      console.error('[supabaseClient] JWT auth failed:', error?.message);
      return null;
    }

    // Look up platform user ID from public.user table
    const { data: appUser, error: lookupError } = await authClient
      .from('user')
      .select('id')
      .ilike('email', user.email ?? '')
      .maybeSingle();

    if (lookupError || !appUser) {
      console.error('[supabaseClient] User lookup failed:', lookupError?.message);
      return null;
    }

    return {
      id: appUser.id,
      email: user.email ?? '',
      supabaseAuthId: user.id,
      legacyPlatformId: user.user_metadata?.user_id as string | undefined,
    };
  } catch (e) {
    console.error('[supabaseClient] Auth exception:', (e as Error).message);
    return null;
  }
}

/**
 * Authenticate using legacy user_id from payload.
 * Uses service role client to look up the user directly.
 */
async function authenticateWithLegacyId(
  userId: string,
  config: SupabaseConfig
): Promise<AuthenticatedUser | null> {
  try {
    const adminClient = createServiceClient(config);

    const { data: userData, error } = await adminClient
      .from('user')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (error || !userData) {
      console.error('[supabaseClient] Legacy lookup failed:', error?.message);
      return null;
    }

    return {
      id: userData.id,
      email: userData.email ?? '',
    };
  } catch (e) {
    console.error('[supabaseClient] Legacy auth exception:', (e as Error).message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Re-exports for convenience
// ─────────────────────────────────────────────────────────────

export { corsHeaders } from './cors.ts';
export type { SupabaseConfig } from './functional/orchestration.ts';
