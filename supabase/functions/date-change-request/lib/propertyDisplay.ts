/**
 * Property Display Utilities for Date Change Request Emails
 * Split Lease - Supabase Edge Functions
 *
 * Provides functions to build property display strings from listing data.
 * Handles various combinations of property names and addresses.
 *
 * FP PRINCIPLES:
 * - Pure functions with no side effects
 * - Immutable data structures
 * - Explicit dependencies
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Listing data from database
 */
export interface ListingData {
  _id: string;
  Title?: string | null;
  'Display Name'?: string | null;
  'Display Address'?: string | null;
  Address?: string | null;
  'Address Line 1'?: string | null;
  City?: string | null;
  State?: string | null;
  'Zip Code'?: string | null;
}

/**
 * Property display result
 */
export interface PropertyDisplay {
  short: string;           // e.g., "Beautiful Cozy Apartment"
  full: string;            // e.g., "Beautiful Cozy Apartment (123 Main St)"
  addressOnly: string;     // e.g., "123 Main St, New York, NY 10001"
}

// ─────────────────────────────────────────────────────────────
// Property Display Builders
// ─────────────────────────────────────────────────────────────

/**
 * Build property display string from listing data
 * Returns various formats for different email contexts
 *
 * @param listing - Listing data object
 * @returns PropertyDisplay object with multiple format options
 */
export function buildPropertyDisplay(listing: ListingData | null): PropertyDisplay {
  // Handle missing listing data
  if (!listing) {
    return {
      short: 'Property',
      full: 'Property',
      addressOnly: 'Property',
    };
  }

  // Extract name/title - prefer Display Name, then Title
  const name = listing['Display Name'] || listing.Title || '';

  // Extract address - prefer Display Address, then build from components
  let address = listing['Display Address'] || listing.Address || '';

  // If no Display Address, build from components
  if (!address && (listing['Address Line 1'] || listing.City)) {
    const parts = [
      listing['Address Line 1'],
      listing.City,
      listing.State,
      listing['Zip Code'],
    ].filter(Boolean) as string[];

    address = parts.join(', ');
  }

  // Build display strings
  const short = name || 'Property';
  const addressOnly = address || 'Property';

  // Full format: "Name (Address)" or just "Name" or just "Address"
  let full = '';
  if (name && address) {
    full = `${name} (${address})`;
  } else if (name) {
    full = name;
  } else {
    full = address;
  }

  return {
    short,
    full,
    addressOnly,
  };
}

/**
 * Get property display for email body (full format)
 * Shortcut function for common use case
 */
export function getPropertyDisplayName(listing: ListingData | null): string {
  return buildPropertyDisplay(listing).full;
}

/**
 * Get property short display for banners/headers
 */
export function getPropertyDisplayShort(listing: ListingData | null): string {
  return buildPropertyDisplay(listing).short;
}

// ─────────────────────────────────────────────────────────────
// Database Query Functions
// ─────────────────────────────────────────────────────────────

/**
 * Fetch listing data by ID
 *
 * @param supabase - Supabase client
 * @param listingId - Listing _id
 * @returns Listing data or null if not found
 */
export async function fetchListingData(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingData | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('_id, Title, "Display Name", "Display Address", Address, "Address Line 1", City, State, "Zip Code"')
      .eq('_id', listingId)
      .maybeSingle();

    if (error) {
      console.warn('[propertyDisplay] Listing fetch error:', error.message);
      return null;
    }

    return data as ListingData | null;
  } catch (_err) {
    console.warn('[propertyDisplay] Listing fetch exception:', (err as Error).message);
    return null;
  }
}

/**
 * Fetch listing data from a lease (via Listing field)
 *
 * @param supabase - Supabase client
 * @param leaseId - Lease/booking _id
 * @returns Listing data or null if not found
 */
export async function fetchListingFromLease(
  supabase: SupabaseClient,
  leaseId: string
): Promise<ListingData | null> {
  try {
    // First get the listing ID from the lease
    const { data: lease, error: leaseError } = await supabase
      .from('bookings_leases')
      .select('Listing')
      .eq('_id', leaseId)
      .maybeSingle();

    if (leaseError || !lease?.Listing) {
      console.warn('[propertyDisplay] Lease fetch error or no listing:', leaseError?.message);
      return null;
    }

    // Then fetch the listing data
    return await fetchListingData(supabase, lease.Listing);
  } catch (_err) {
    console.warn('[propertyDisplay] Listing from lease fetch exception:', (err as Error).message);
    return null;
  }
}

/**
 * Fetch both lease and listing data together
 * More efficient than separate queries when you need both
 *
 * @param supabase - Supabase client
 * @param leaseId - Lease/booking _id
 * @returns Object with lease and listing data
 */
export async function fetchLeaseAndListing(
  supabase: SupabaseClient,
  leaseId: string
): Promise<{ lease: Record<string, unknown> | null; listing: ListingData | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings_leases')
      .select(`
        _id,
        Listing,
        check_in,
        check_out,
        "Agreement Number"
      `)
      .eq('_id', leaseId)
      .maybeSingle();

    if (error || !data) {
      console.warn('[propertyDisplay] Lease/listing fetch error:', error?.message);
      return { lease: null, listing: null };
    }

    // Fetch listing data if we have a listing ID
    let listing: ListingData | null = null;
    if (data.Listing) {
      listing = await fetchListingData(supabase, data.Listing);
    }

    return {
      lease: data,
      listing,
    };
  } catch (_err) {
    console.warn('[propertyDisplay] Lease/listing fetch exception:', (err as Error).message);
    return { lease: null, listing: null };
  }
}

// ─────────────────────────────────────────────────────────────
// URL Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate URL to view booking details
 *
 * @param leaseId - Lease/booking _id
 * @param recipientRole - 'guest' or 'host'
 * @returns Full URL to booking page
 */
export function generateBookingUrl(leaseId: string, recipientRole: 'guest' | 'host'): string {
  const basePath = recipientRole === 'guest' ? 'guest-leases' : 'host-leases';
  return `https://split.lease/${basePath}?lease=${leaseId}`;
}

/**
 * Generate URL to manage/review a date change request
 *
 * @param leaseId - Lease/booking _id
 * @param requestId - Date change request _id
 * @param recipientRole - 'guest' or 'host'
 * @returns Full URL to request page
 */
export function generateRequestUrl(
  leaseId: string,
  requestId: string,
  recipientRole: 'guest' | 'host'
): string {
  const basePath = recipientRole === 'guest' ? 'guest-leases' : 'host-leases';
  return `https://split.lease/${basePath}?lease=${leaseId}&request=${requestId}`;
}

/**
 * Generate URL for property listing page
 *
 * @param listingId - Listing _id
 * @returns Full URL to listing page
 */
export function generateListingUrl(listingId: string): string {
  return `https://split.lease/listing/${listingId}`;
}
