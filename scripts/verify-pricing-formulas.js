import { calculatePrice } from '../app/src/lib/scheduleSelector/priceCalculations.js';

const config = {
    overallSiteMarkup: 0.17,
    fullTimeDiscount: 0.13,
    unusedNightsDiscountMultiplier: 0.03,
    avgDaysPerMonth: 30.4,
    weeklyMarkup: 0
};

const listing = {
    rentalType: 'Nightly',
    weeksOffered: 'Every week',
    unitMarkup: 5, // 5% becomes 0.05 in calculations
    cleaningFee: 0,
    damageDeposit: 0,

    // Host Rates (Simplifying to 100 to easily see multipliers)
    nightlyHostRateFor2Nights: 100,
    nightlyHostRateFor3Nights: 100,
    nightlyHostRateFor4Nights: 100,
    nightlyHostRateFor5Nights: 100,
    nightlyHostRateFor7Nights: 100,

    // Legacy field names backup
    '💰Nightly Host Rate for 2 nights': 100,
    '💰Nightly Host Rate for 3 nights': 100,
    '💰Nightly Host Rate for 4 nights': 100,
    '💰Nightly Host Rate for 5 nights': 100,
    '💰Nightly Host Rate for 7 nights': 100,
    '💰Unit Markup': 5
};

console.log("==================================================");
console.log("PRICING FORMULA VERIFICATION");
console.log("==================================================");
console.log("Config:", JSON.stringify(config, null, 2));
console.log("Listing Unit Markup:", listing.unitMarkup + "%");
console.log("Host Nightly Rate: $100 (Flat)");
console.log("--------------------------------------------------");

const nightsToTest = [7, 5, 4, 3, 2];

let allPassed = true;

for (const nights of nightsToTest) {
    // Create dummy 'selectedNights' array
    const selectedNights = Array(nights).fill({});

    // Run Calculation
    const result = calculatePrice(selectedNights, listing, 13, config);

    // Reverse engineer multiplier
    // Base host rate is 100.
    const multiplier = result.pricePerNight / 100;

    // Expected Multiplier Calculation
    // Additive Formula: 1 + Site(0.17) + Unit(0.05) - Unused - FullTime
    const unusedNights = 7 - nights;
    const unusedDiscount = unusedNights * 0.03;
    const fullTimeDiscount = nights === 7 ? 0.13 : 0;

    const expected = 1 + 0.17 + 0.05 - unusedDiscount - fullTimeDiscount;

    const isMatch = Math.abs(multiplier - expected) < 0.001;
    if (!isMatch) allPassed = false;

    console.log(`\n--- ${nights} Nights ---`);
    console.log(`Unused Nights: ${unusedNights} (Discount: ${unusedDiscount.toFixed(2)})`);
    console.log(`Full Time Discount: ${fullTimeDiscount.toFixed(2)}`);
    console.log(`Calculated Price Per Night: $${result.pricePerNight.toFixed(2)}`);
    console.log(`Effective Multiplier:       ${multiplier.toFixed(4)}`);
    console.log(`Expected Multiplier:        ${expected.toFixed(4)}`);
    console.log(`Status: ${isMatch ? "✅ MATCH" : "❌ MISMATCH"}`);
}

console.log("==================================================");
if (allPassed) {
    console.log("GRAND RESULT: ✅ ALL TESTS PASSED");
} else {
    console.log("GRAND RESULT: ❌ SOME TESTS FAILED");
    process.exit(1);
}
