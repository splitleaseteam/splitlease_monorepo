import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

// Environment-aware session storage:
// - Localhost (HTTP): Use localStorage to avoid Secure cookie rejection
// - Production (HTTPS): Use default cookie storage for security
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

const clientOptions = isLocalhost
  ? {
      auth: {
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  : undefined; // Production uses secure cookies (default)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Default export for compatibility with files using default import syntax
export default supabase;

// Process any pending OAuth login callback immediately
// This runs when the supabase module is first imported (early in app lifecycle)
// Using dynamic import to avoid circular dependency (oauthCallbackHandler imports auth.js which imports supabase.js)
// Result is fire-and-forget - the Header's onAuthStateChange will handle UI updates
import('./oauthCallbackHandler.js').then(({ processOAuthLoginCallback }) => {
  processOAuthLoginCallback().then(result => {
    if (result.processed) {
      console.log('[Supabase Init] OAuth callback processed:', result.success ? 'success' : 'failed');
    }
  }).catch(err => {
    console.error('[Supabase Init] OAuth callback error:', err);
  });
});
