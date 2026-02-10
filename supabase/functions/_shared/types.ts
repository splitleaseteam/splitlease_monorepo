/**
 * Shared TypeScript type definitions for Supabase Edge Functions
 * Split Lease
 */

export interface EdgeFunctionRequest {
  action: string;
  payload: Record<string, any>;
}

export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  user_id?: string;
  token?: string;
  expires?: number;
  error?: string;
  reason?: string;
}
