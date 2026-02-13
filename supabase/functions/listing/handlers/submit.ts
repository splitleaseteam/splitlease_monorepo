/**
 * Listing Full Submission Handler
 * Priority: CRITICAL
 *
 * STANDARDIZED FLOW (Supabase-only):
 * 1. Validate listing exists in Supabase
 * 2. Update listing in Supabase with all form data
 * 3. Attach user to listing (via user_email or user_id)
 * 4. Create mockup proposal for first-time hosts
 * 5. Return updated listing data
 *
 * NO FALLBACK PRINCIPLE: Supabase is the source of truth
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { getGeoByZipCode } from '../../_shared/geoLookup.ts';

/**
 * Listing submission data structure from frontend
 */
interface ListingSubmissionData {
  // Basic Info
  'Name'?: string;
  'Type of Space'?: string;
  'Bedrooms'?: number;
  'Beds'?: number;
  'Bathrooms'?: number;
  'Type of Kitchen'?: string;
  'Type of Parking'?: string;

  // Address
  'Address'?: string;
  'Street Number'?: string;
  'Street'?: string;
  'City'?: string;
  'State'?: string;
  'Zip'?: string;
  'Neighborhood'?: string;
  'Latitude'?: number;
  'Longitude'?: number;

  // Amenities
  'Amenities Inside Unit'?: string[];
  'Amenities Outside Unit'?: string[];

  // Descriptions
  'Description of Lodging'?: string;
  'Neighborhood Description'?: string;

  // Lease Style
  'Rental Type'?: string;
  'Available Nights'?: string[];
  'Weekly Pattern'?: string;

  // Pricing
  'Damage Deposit'?: number;
  'Maintenance Fee'?: number;
  'Monthly Compensation'?: number;
  'Weekly Compensation'?: number;
  'Price 1 night selected'?: number;
  'Price 2 nights selected'?: number;
  'Price 3 nights selected'?: number;
  'Price 4 nights selected'?: number;
  'Price 5 nights selected'?: number;
  'Price 6 nights selected'?: number;
  'Price 7 nights selected'?: number;
  'Nightly Decay Rate'?: number;

  // Rules
  'Cancellation Policy'?: string;
  'Preferred Gender'?: string;
  'Number of Guests'?: number;
  'Check-In Time'?: string;
  'Check-Out Time'?: string;
  'Ideal Min Duration'?: number;
  'Ideal Max Duration'?: number;
  'House Rules'?: string[];
  'Blocked Dates'?: string[];

  // Safety & Review
  'Safety Features'?: string[];
  'Square Footage'?: number;
  'First Day Available'?: string;
  'Previous Reviews Link'?: string;
  'Optional Notes'?: string;

  // Status
  'Status'?: string;
  'Is Draft'?: boolean;

  // Additional fields
  [key: string]: unknown;
}

interface SubmitListingPayload {
  listing_id: string;
  user_email: string;
  user_unique_id?: string;
  listing_data: ListingSubmissionData;
}

interface SubmitListingResult {
  id: string;
  listing_id: string;
  status: string;
  name: string;
  message: string;
  [key: string]: unknown;
}

/**
 * Map frontend field names to Supabase listing table column names
 * All column names use snake_case matching the listing table schema
 */
function mapFieldsToSupabase(data: ListingSubmissionData): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  // Basic info
  if (data['Name'] !== undefined) {
    mapped.listing_title = data['Name'];
  }
  if (data['Description of Lodging'] !== undefined) {
    mapped.listing_description = data['Description of Lodging'];
  }
  if (data['Neighborhood Description'] !== undefined) {
    mapped.neighborhood_description_by_host = data['Neighborhood Description'];
  }
  if (data['Bedrooms'] !== undefined) {
    mapped.bedroom_count = data['Bedrooms'];
  }
  if (data['Beds'] !== undefined) {
    mapped.bed_count = data['Beds'];
  }
  if (data['Bathrooms'] !== undefined) {
    mapped.bathroom_count = data['Bathrooms'];
  }

  // Space & features
  if (data['Type of Space'] !== undefined) {
    mapped.space_type = data['Type of Space'];
  }
  if (data['Type of Kitchen'] !== undefined) {
    mapped.kitchen_type = data['Type of Kitchen'];
  }
  if (data['Type of Parking'] !== undefined) {
    mapped.parking_type = data['Type of Parking'];
  }

  // Location
  if (data['City'] !== undefined) {
    mapped.city = data['City'];
  }
  if (data['State'] !== undefined) {
    mapped.state = data['State'];
  }
  if (data['Zip'] !== undefined) {
    mapped.zip_code = data['Zip'];
  }
  if (data['Neighborhood'] !== undefined) {
    mapped.neighborhood_name_entered_by_host = data['Neighborhood'];
  }
  if (data['Latitude'] !== undefined && data['Longitude'] !== undefined) {
    mapped.address_with_lat_lng_json = {
      lat: data['Latitude'],
      lng: data['Longitude'],
      address: data['Address'] || '',
    };
  }

  // Amenities & rules
  if (data['Amenities Inside Unit'] !== undefined) {
    mapped.in_unit_amenity_reference_ids_json = data['Amenities Inside Unit'];
  }
  if (data['Amenities Outside Unit'] !== undefined) {
    mapped.in_building_amenity_reference_ids_json = data['Amenities Outside Unit'];
  }
  if (data['House Rules'] !== undefined) {
    mapped.house_rule_reference_ids_json = data['House Rules'];
  }
  if (data['Safety Features'] !== undefined) {
    mapped.safety_feature_reference_ids_json = data['Safety Features'];
  }

  // Lease style
  if (data['Rental Type'] !== undefined) {
    mapped.rental_type = data['Rental Type'];
  }
  if (data['Available Nights'] !== undefined) {
    mapped.available_nights_as_day_numbers_json = data['Available Nights'];
    mapped.available_days_as_day_numbers_json = data['Available Nights'];
  }
  if (data['Weekly Pattern'] !== undefined) {
    mapped.weeks_offered_schedule_text = data['Weekly Pattern'];
  }

  // Pricing
  if (data['Damage Deposit'] !== undefined) {
    mapped.damage_deposit_amount = data['Damage Deposit'];
  }
  if (data['Maintenance Fee'] !== undefined) {
    mapped.cleaning_fee_amount = data['Maintenance Fee'];
  }
  if (data['Monthly Compensation'] !== undefined) {
    mapped.monthly_rate_paid_to_host = data['Monthly Compensation'];
  }
  if (data['Weekly Compensation'] !== undefined) {
    mapped.weekly_rate_paid_to_host = data['Weekly Compensation'];
  }

  // Guest rules
  if (data['Cancellation Policy'] !== undefined) {
    mapped.cancellation_policy = data['Cancellation Policy'];
  }
  if (data['Preferred Gender'] !== undefined) {
    mapped.preferred_guest_gender = data['Preferred Gender'];
  }
  if (data['Number of Guests'] !== undefined) {
    mapped.max_guest_count = data['Number of Guests'];
  }
  if (data['Check-In Time'] !== undefined) {
    mapped.checkin_time_of_day = data['Check-In Time'];
  }
  if (data['Check-Out Time'] !== undefined) {
    mapped.checkout_time_of_day = data['Check-Out Time'];
  }
  if (data['Ideal Min Duration'] !== undefined) {
    mapped.minimum_nights_per_stay = data['Ideal Min Duration'];
  }
  if (data['Ideal Max Duration'] !== undefined) {
    mapped.maximum_nights_per_stay = data['Ideal Max Duration'];
  }

  // Other
  if (data['First Day Available'] !== undefined) {
    mapped.first_available_date = data['First Day Available'];
  }
  if (data['Square Footage'] !== undefined) {
    mapped.square_feet = data['Square Footage'];
  }

  // Nightly prices (no 6-night rate exists in the listing table)
  if (data['Price 1 night selected'] !== undefined) {
    mapped.nightly_rate_for_1_night_stay = data['Price 1 night selected'];
  }
  if (data['Price 2 nights selected'] !== undefined) {
    mapped.nightly_rate_for_2_night_stay = data['Price 2 nights selected'];
  }
  if (data['Price 3 nights selected'] !== undefined) {
    mapped.nightly_rate_for_3_night_stay = data['Price 3 nights selected'];
  }
  if (data['Price 4 nights selected'] !== undefined) {
    mapped.nightly_rate_for_4_night_stay = data['Price 4 nights selected'];
  }
  if (data['Price 5 nights selected'] !== undefined) {
    mapped.nightly_rate_for_5_night_stay = data['Price 5 nights selected'];
  }
  if (data['Price 7 nights selected'] !== undefined) {
    mapped.nightly_rate_for_7_night_stay = data['Price 7 nights selected'];
  }

  // Blocked dates
  if (data['Blocked Dates'] !== undefined) {
    mapped.blocked_specific_dates_json = data['Blocked Dates'];
  }

  return mapped;
}

/**
 * Handle full listing submission with Supabase-first pattern
 * Called after user signup/login with complete form data
 */
export async function handleSubmit(
  payload: Record<string, unknown>
): Promise<SubmitListingResult> {
  console.log('[listing:submit] ========== SUBMIT LISTING (SUPABASE-FIRST) ==========');
  console.log('[listing:submit] Payload keys:', Object.keys(payload));

  // Validate required fields
  validateRequiredFields(payload, ['listing_id', 'user_email', 'listing_data']);

  const { listing_id, user_email, user_unique_id, listing_data } = payload as SubmitListingPayload;

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables');
  }

  // Initialize Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('[listing:submit] Listing ID:', listing_id);
  console.log('[listing:submit] User Email:', user_email);
  console.log('[listing:submit] User Unique ID:', user_unique_id || 'Not provided');

  try {
    // Step 1: Verify listing exists
    console.log('[listing:submit] Step 1/4: Verifying listing exists...');
    const { data: existingListing, error: fetchError } = await supabase
      .from('listing')
      .select('id, listing_title, listing_setup_progress_stage')
      .eq('id', listing_id)
      .single();

    if (fetchError || !existingListing) {
      console.error('[listing:submit] Listing not found:', listing_id);
      throw new Error(`Listing not found: ${listing_id}`);
    }

    console.log('[listing:submit] ✅ Step 1 complete - Listing exists:', existingListing.listing_title);

    // Step 2: Look up user
    console.log('[listing:submit] Step 2/4: Looking up user...');
    const { data: userData } = await supabase
      .from('user')
      .select('id')
      .eq('email', user_email.toLowerCase())
      .single();

    let userId: string | null = null;

    if (userData) {
      userId = userData.id;
      console.log('[listing:submit] ✅ Step 2 complete - User found:', userId);
    } else {
      console.log('[listing:submit] ⚠️ Step 2 warning - User not found for email:', user_email);
    }

    // Step 2b: Look up borough and hood from zip code (non-blocking - graceful degradation)
    console.log('[listing:submit] Step 2b/4: Looking up borough/hood from zip code...');
    let boroughId: string | null = null;
    let hoodId: string | null = null;

    const zipCode = listing_data['Zip'];
    if (zipCode) {
      try {
        const geoResult = await getGeoByZipCode(supabase, zipCode as string);
        if (geoResult.borough) {
          boroughId = geoResult.borough.id;
          console.log('[listing:submit] ✅ Borough found:', geoResult.borough.displayName);
        }
        if (geoResult.hood) {
          hoodId = geoResult.hood.id;
          console.log('[listing:submit] ✅ Hood found:', geoResult.hood.displayName);
        }
      } catch (geoError) {
        // Geo lookup is supplementary - continue without location data
        console.warn('[listing:submit] ⚠️ Geo lookup failed (non-blocking):', geoError instanceof Error ? geoError.message : geoError);
      }
    } else {
      console.log('[listing:submit] ⚠️ No zip code provided, skipping geo lookup');
    }

    // Step 3: Update listing in Supabase
    console.log('[listing:submit] Step 3/4: Updating listing in Supabase...');
    const now = new Date().toISOString();

    // Map frontend fields to Supabase columns
    const mappedData = mapFieldsToSupabase(listing_data);

    // Build update object
    const updateData: Record<string, unknown> = {
      ...mappedData,
      updated_at: now,
      listing_setup_progress_stage: listing_data['Status'] || 'Pending Review',
    };

    // Add borough and hood FK references if found
    if (boroughId) {
      updateData.borough = boroughId;
      console.log('[listing:submit] Setting borough:', boroughId);
    }
    if (hoodId) {
      updateData.primary_neighborhood_reference_id = hoodId;
      console.log('[listing:submit] Setting primary_neighborhood_reference_id:', hoodId);
    }

    // Attach user if found (host_user_id = user.id)
    if (userId) {
      updateData.host_user_id = userId;
      updateData.created_by_user_id = userId;
      updateData.host_email = user_email.toLowerCase();
    }

    const { error: updateError } = await supabase
      .from('listing')
      .update(updateData)
      .eq('id', listing_id);

    if (updateError) {
      console.error('[listing:submit] Update failed:', updateError);
      throw new Error(`Failed to update listing: ${updateError.message}`);
    }

    console.log('[listing:submit] ✅ Step 3 complete - Listing updated in Supabase');

    // Step 4: Check if first listing and create mockup proposal
    if (userId) {
      try {
        console.log('[listing:submit] Step 4/4: Checking for first listing...');

        // Query listing table directly to count user's listings
        // NOTE: We can't use user.Listings array because it may not be updated yet
        const { count: listingCount, error: countError } = await supabase
          .from('listing')
          .select('id', { count: 'exact', head: true })
          .eq('host_user_id', userId);

        if (countError) {
          console.warn('[listing:submit] Failed to count listings:', countError.message);
        }

        const totalListings = listingCount ?? 0;
        console.log('[listing:submit] User listing count from listing table:', totalListings);

        if (totalListings === 1) {
          console.log('[listing:submit] First listing detected, triggering mockup proposal creation');

          // Fire-and-forget call to proposal edge function
          // Mockup creation is non-blocking - failures don't affect listing submission
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

          if (supabaseUrl && serviceRoleKey) {
            fetch(`${supabaseUrl}/functions/v1/proposal`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'create_mockup',
                payload: {
                  listingId: listing_id,
                  hostUserId: userId,
                  hostEmail: user_email,
                }
              })
            }).then(response => {
              if (response.ok) {
                console.log('[listing:submit] ✅ Mockup proposal creation triggered successfully');
              } else {
                console.warn('[listing:submit] ⚠️ Mockup trigger returned:', response.status);
              }
            }).catch(err => {
              console.warn('[listing:submit] ⚠️ Mockup trigger failed (non-blocking):', err.message);
            });
          } else {
            console.warn('[listing:submit] ⚠️ Missing environment variables for mockup creation');
          }

          console.log('[listing:submit] ✅ Step 4 complete - Mockup proposal creation triggered');
        } else {
          console.log(`[listing:submit] ⏭️ Step 4 skipped - Not first listing (count: ${totalListings})`);
        }
      } catch (mockupError) {
        // Non-blocking - log but don't fail listing submission
        console.warn('[listing:submit] ⚠️ Mockup proposal creation failed (non-blocking):', mockupError);
      }
    } else {
      console.log('[listing:submit] ⏭️ Step 4 skipped - User not found');
    }

    console.log('[listing:submit] ========== SUCCESS ==========');

    // Return the updated listing data
    return {
      id: listing_id,
      listing_id: listing_id,
      status: (listing_data['Status'] as string) || 'Pending Review',
      name: (listing_data['Name'] as string) || existingListing.listing_title,
      message: 'Listing submitted successfully',
      ...updateData
    };
  } catch (error) {
    console.error('[listing:submit] ========== ERROR ==========');
    const errorDetails = {
      code: (error as { code?: string })?.code || 'UNKNOWN',
      message: error instanceof Error ? error.message : String(error),
      details: (error as { details?: string })?.details,
      hint: (error as { hint?: string })?.hint,
    };
    console.error('[listing:submit] Failed to submit listing:', errorDetails);
    throw error;
  }
}
