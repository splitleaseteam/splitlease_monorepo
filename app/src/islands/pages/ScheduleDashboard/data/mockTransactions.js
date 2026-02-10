/**
 * Mock transactions for ScheduleDashboard development
 *
 * Fee Structure:
 * - Full Week: 1.5% per party (both initiator and recipient pay their own 1.5% fee)
 * - Alternating: $5 flat (initiator only)
 * - Share: $5 flat (initiator only)
 *
 * Fields:
 * - baseAmount: The negotiated/offered amount before fees
 * - initiatorFee: Fee charged to the person initiating the request
 * - recipientFee: Fee charged to the person receiving/approving the request
 * - initiatorPays: Total the initiator pays (base + their fee, for buyouts)
 * - recipientReceives: Net the recipient receives (base - their fee, for buyouts)
 */

const FEE_RATE = 0.015; // 1.5% per party for buyouts
const SWAP_FEE = 5.00;  // Flat $5 for swaps (initiator only)
const SHARE_FEE = 5.00; // Flat $5 for shares (initiator only)

/**
 * Calculate fees for a buyout transaction
 */
function calculateFullWeekFees(baseAmount) {
  const fee = Math.round(baseAmount * FEE_RATE * 100) / 100;
  return {
    initiatorFee: fee,
    recipientFee: fee,
    initiatorPays: Math.round((baseAmount + fee) * 100) / 100,
    recipientReceives: Math.round((baseAmount - fee) * 100) / 100
  };
}

export const MOCK_TRANSACTIONS = [
  // txn-1: Pending buyout - current user is initiator (buying from Sarah)
  // Base: $150, Fee: 1.5% = $2.25 each
  {
    id: 'txn-1',
    date: new Date(2026, 0, 28),
    type: 'full_week',
    nights: [new Date(2026, 1, 14)],
    baseAmount: 150,
    amount: 150, // Legacy field for backwards compatibility
    ...calculateFullWeekFees(150),
    suggestedPrice: 150,
    offeredPrice: 150,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'pending'
  },
  // txn-2: Completed swap - current user initiated
  // Alternating fee: $5 (initiator only)
  {
    id: 'txn-2',
    date: new Date(2026, 0, 25),
    type: 'alternating',
    nights: [new Date(2026, 1, 10), new Date(2026, 1, 17)],
    baseAmount: 0,
    amount: 0,
    initiatorFee: SWAP_FEE,
    recipientFee: 0,
    initiatorPays: SWAP_FEE,
    recipientReceives: 0,
    suggestedPrice: 0,
    offeredPrice: 0,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'complete'
  },
  // txn-3: Completed buyout - Sarah initiated (current user is recipient/seller)
  // Base: $125, Fee: 1.5% = $1.88 each
  {
    id: 'txn-3',
    date: new Date(2026, 0, 20),
    type: 'full_week',
    nights: [new Date(2026, 1, 7)],
    baseAmount: 125,
    amount: 125,
    ...calculateFullWeekFees(125),
    suggestedPrice: 125,
    offeredPrice: 125,
    payerId: 'user-456',
    payeeId: 'current-user',
    status: 'complete'
  },
  // txn-4: Declined buyout - current user initiated (lowball offer)
  // Base: $175 (offered), Suggested: $220
  {
    id: 'txn-4',
    date: new Date(2026, 0, 15),
    type: 'full_week',
    nights: [new Date(2026, 1, 3)],
    baseAmount: 175,
    amount: 175,
    ...calculateFullWeekFees(175),
    suggestedPrice: 220,
    offeredPrice: 175,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'declined'
  },
  // txn-5: Pending swap - current user initiated
  {
    id: 'txn-5',
    date: new Date(2026, 0, 30),
    type: 'alternating',
    nights: [new Date(2026, 1, 11), new Date(2026, 1, 14)],
    baseAmount: 0,
    amount: 0,
    initiatorFee: SWAP_FEE,
    recipientFee: 0,
    initiatorPays: SWAP_FEE,
    recipientReceives: 0,
    suggestedPrice: 0,
    offeredPrice: 0,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'pending'
  }
];
