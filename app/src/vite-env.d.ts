/**
 * Vite Environment Type Declarations
 *
 * Declares Vite-specific types for TypeScript.
 * This fixes ImportMeta.env issues and provides type safety for environment variables.
 */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_SMART_PRICING?: string
  readonly VITE_ENABLE_SMART_DATES?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
