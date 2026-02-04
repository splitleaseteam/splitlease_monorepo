/**
 * ROOMMATE PAIR DETECTION
 * Gap 1: Detects alternating roommate pairs (Mon-Fri vs Fri-Mon)
 *
 * This utility identifies users who share the same listing on complementary schedules.
 * Essential for Pattern 4 (BS+BS Competition) to know WHO the alternating roommate is.
 *
 * PRODUCTION-READY: Uses existing complementary nights data
 * FUTURE ENHANCEMENT: Create roommate_pairs table and cache detected pairs
 */

/**
 * Find potential roommate pairs for a listing
 *
 * @param {string} listingId - Listing ID
 * @param {Array} activeLeases - All active leases for this listing
 * @returns {Array<RoommatePair>} Detected pairs with matching details
 */
export function detectRoommatePairs(listingId, activeLeases) {
  const pairs = [];

  if (!activeLeases || activeLeases.length < 2) {
    return pairs; // Need at least 2 leases to form a pair
  }

  // Compare each lease to every other lease
  for (let i = 0; i < activeLeases.length; i++) {
    for (let j = i + 1; j < activeLeases.length; j++) {
      const leaseA = activeLeases[i];
      const leaseB = activeLeases[j];

      // Skip if leases don't have proposal data
      if (!leaseA.proposal || !leaseB.proposal) {
        continue;
      }

      // Get nights from each lease's proposal
      const nightsA = leaseA.proposal['Nights Selected (Nights list)'] || [];
      const nightsB = leaseB.proposal['Nights Selected (Nights list)'] || [];

      // Check if schedules are complementary (no overlap)
      const overlap = nightsA.filter(night => nightsB.includes(night));
      const combined = [...new Set([...nightsA, ...nightsB])];

      // Perfect complement - they cover all 7 nights with zero overlap
      if (overlap.length === 0 && combined.length === 7) {
        pairs.push({
          userA: {
            id: leaseA.Guest || leaseA.guest_id,
            leaseId: leaseA._id || leaseA.id,
            nights: nightsA,
          },
          userB: {
            id: leaseB.Guest || leaseB.guest_id,
            leaseId: leaseB._id || leaseB.id,
            nights: nightsB,
          },
          listingId,
          pairingType: determinePairingType(nightsA, nightsB),
          matchScore: 100, // Perfect match
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return pairs;
}

/**
 * Determine pairing pattern type based on night distribution
 *
 * @param {Array<number>} nightsA - Nights for user A (1=Mon, 7=Sun)
 * @param {Array<number>} nightsB - Nights for user B
 * @returns {string} Pairing type identifier
 */
function determinePairingType(nightsA, nightsB) {
  // Count weekdays (Monday-Friday: 1-5)
  const weekdaysA = nightsA.filter(n => n >= 1 && n <= 5).length;
  const weekdaysB = nightsB.filter(n => n >= 1 && n <= 5).length;

  // Count weekend days (Saturday-Sunday: 6-7)
  const weekendA = nightsA.filter(n => n >= 6 && n <= 7).length;
  const weekendB = nightsB.filter(n => n >= 6 && n <= 7).length;

  // A has Mon-Fri, B has Sat-Sun + partials
  if (weekdaysA === 5 && weekendB === 2) {
    return 'weekday_weekend';
  }

  // B has Mon-Fri, A has Sat-Sun + partials
  if (weekdaysB === 5 && weekendA === 2) {
    return 'weekend_weekday';
  }

  // Custom alternating pattern (e.g., Mon/Wed/Fri vs Tue/Thu/Sat/Sun)
  return 'custom_alternating';
}

/**
 * Get roommate for a specific user and listing
 *
 * @param {string} userId - User ID to find roommate for
 * @param {string} listingId - Listing ID
 * @param {Array} activeLeases - Active leases for the listing
 * @returns {Object|null} Roommate info or null if no roommate found
 */
export function getRoommateForUser(userId, listingId, activeLeases) {
  const pairs = detectRoommatePairs(listingId, activeLeases);

  for (const pair of pairs) {
    if (pair.userA.id === userId) {
      return {
        id: pair.userB.id,
        leaseId: pair.userB.leaseId,
        nights: pair.userB.nights,
        relationship: 'alternating_roommate',
        pairingType: pair.pairingType,
        matchScore: pair.matchScore,
      };
    }

    if (pair.userB.id === userId) {
      return {
        id: pair.userA.id,
        leaseId: pair.userA.leaseId,
        nights: pair.userA.nights,
        relationship: 'alternating_roommate',
        pairingType: pair.pairingType,
        matchScore: pair.matchScore,
      };
    }
  }

  return null; // No roommate found
}

/**
 * Format nights array for display (e.g., "Mon, Wed, Fri")
 *
 * @param {Array<number>} nights - Array of night numbers (1-7)
 * @returns {string} Formatted night string
 */
export function formatNights(nights) {
  const dayNames = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun',
  };

  if (!nights || nights.length === 0) {
    return 'No nights';
  }

  // Sort nights in order
  const sortedNights = [...nights].sort((a, b) => a - b);

  // Convert to day names
  const dayStrings = sortedNights.map(n => dayNames[n] || `Day ${n}`);

  return dayStrings.join(', ');
}

/**
 * Check if two users are roommate pairs
 *
 * @param {string} userIdA - First user ID
 * @param {string} userIdB - Second user ID
 * @param {string} listingId - Listing ID
 * @param {Array} activeLeases - Active leases
 * @returns {boolean} True if users are roommate pairs
 */
export function areRoommates(userIdA, userIdB, listingId, activeLeases) {
  const pairs = detectRoommatePairs(listingId, activeLeases);

  return pairs.some(pair =>
    (pair.userA.id === userIdA && pair.userB.id === userIdB) ||
    (pair.userA.id === userIdB && pair.userB.id === userIdA)
  );
}

/**
 * Get all roommate pairs for a listing (for admin/debug)
 *
 * @param {string} listingId - Listing ID
 * @param {Array} activeLeases - Active leases
 * @returns {Array<RoommatePair>} All detected pairs
 */
export function getAllRoommatePairs(listingId, activeLeases) {
  return detectRoommatePairs(listingId, activeLeases);
}

/**
 * Calculate overlap percentage between two night schedules
 * (Used for partial overlap detection in future enhancements)
 *
 * @param {Array<number>} nightsA - Nights for user A
 * @param {Array<number>} nightsB - Nights for user B
 * @returns {number} Overlap percentage (0-100)
 */
export function calculateNightOverlap(nightsA, nightsB) {
  if (!nightsA || !nightsB || nightsA.length === 0 || nightsB.length === 0) {
    return 0;
  }

  const overlap = nightsA.filter(night => nightsB.includes(night));
  const total = Math.max(nightsA.length, nightsB.length);

  return (overlap.length / total) * 100;
}

/**
 * Get pairing type display label
 *
 * @param {string} pairingType - Pairing type identifier
 * @returns {string} Human-readable label
 */
export function getPairingTypeLabel(pairingType) {
  const labels = {
    weekday_weekend: 'Weekday/Weekend Split',
    weekend_weekday: 'Weekend/Weekday Split',
    custom_alternating: 'Custom Alternating Schedule',
  };

  return labels[pairingType] || 'Unknown Pattern';
}

/**
 * FUTURE ENHANCEMENT: Store detected pairs in database
 *
 * This function is a placeholder for future caching of roommate pairs
 * in a dedicated roommate_pairs table to avoid re-detection.
 *
 * @param {Array<RoommatePair>} pairs - Detected pairs to store
 * @returns {Promise<void>}
 */
export async function cacheRoommatePairs(pairs) {
  // TODO: Implement database storage
  // await supabase.from('roommate_pairs').upsert(pairs);
  console.log('[cacheRoommatePairs] TODO: Store pairs in database', pairs.length);
}

/**
 * FUTURE ENHANCEMENT: Retrieve cached pairs from database
 *
 * @param {string} listingId - Listing ID
 * @returns {Promise<Array<RoommatePair>>}
 */
export async function getCachedRoommatePairs(listingId) {
  // TODO: Implement database retrieval
  // const { data } = await supabase.from('roommate_pairs').select('*').eq('listing_id', listingId);
  // return data || [];
  console.log('[getCachedRoommatePairs] TODO: Retrieve from database', listingId);
  return [];
}
