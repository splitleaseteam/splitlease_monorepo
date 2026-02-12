/**
 * calculateCheckInOutDays
 *
 * Pure function that takes an array of JS day numbers (0-6, where 0=Sunday, 6=Saturday)
 * and detects if the selection wraps around Saturday->Sunday. It finds the gap,
 * reorders the days, and determines check-in day, check-out day, and nights selected.
 *
 * Extracted from FavoriteListingsPage.jsx submitProposal logic.
 *
 * @param {number[]} daysInJsFormat - Array of JS day numbers (0-6)
 * @returns {{ checkInDay: number, checkOutDay: number, nightsSelected: number[], isWrapAround: boolean, sortedDays: number[] }}
 */
export function calculateCheckInOutDays(daysInJsFormat) {
  // Sort days in JS format first to detect wrap-around (Saturday/Sunday spanning)
  const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);

  // Check for wrap-around case (both Saturday=6 and Sunday=0 present, but not all 7 days)
  const hasSaturday = sortedJsDays.includes(6);
  const hasSunday = sortedJsDays.includes(0);
  const isWrapAround = hasSaturday && hasSunday && daysInJsFormat.length < 7;

  let checkInDay, checkOutDay, nightsSelected;

  if (isWrapAround) {
    // Find the gap in the sorted selection to determine wrap-around point
    let gapIndex = -1;
    for (let i = 0; i < sortedJsDays.length - 1; i++) {
      if (sortedJsDays[i + 1] - sortedJsDays[i] > 1) {
        gapIndex = i + 1;
        break;
      }
    }

    if (gapIndex !== -1) {
      // Wrap-around: check-in is the first day after the gap, check-out is the last day before gap
      checkInDay = sortedJsDays[gapIndex];
      checkOutDay = sortedJsDays[gapIndex - 1];

      // Reorder days to be in actual sequence (check-in to check-out)
      const reorderedDays = [...sortedJsDays.slice(gapIndex), ...sortedJsDays.slice(0, gapIndex)];

      // Nights = all days except the last one (checkout day)
      nightsSelected = reorderedDays.slice(0, -1);
    } else {
      // No gap found, use standard logic
      checkInDay = sortedJsDays[0];
      checkOutDay = sortedJsDays[sortedJsDays.length - 1];
      nightsSelected = sortedJsDays.slice(0, -1);
    }
  } else {
    // Standard case: check-in = first day, check-out = last day
    checkInDay = sortedJsDays[0];
    checkOutDay = sortedJsDays[sortedJsDays.length - 1];
    // Nights = all days except the last one (checkout day)
    nightsSelected = sortedJsDays.slice(0, -1);
  }

  return { checkInDay, checkOutDay, nightsSelected, isWrapAround, sortedDays: sortedJsDays };
}
