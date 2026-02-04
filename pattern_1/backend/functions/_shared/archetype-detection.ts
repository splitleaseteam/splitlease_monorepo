/**
 * User Archetype Detection System
 *
 * Detects user behavioral archetypes based on historical transaction patterns.
 * Archetypes: BIG_SPENDER, HIGH_FLEXIBILITY, AVERAGE_USER
 *
 * Algorithm: Heuristic-based scoring with weighted signals
 * Future: Replace with ML-based prediction
 */

export interface ArchetypeSignals {
  // Economic signals
  avgTransactionValue: number;
  willingnessToPay: number;  // 0-1 normalized
  priceRejectionRate: number;  // % of times declined due to price

  // Behavioral signals
  avgResponseTimeHours: number;
  acceptanceRate: number;  // Overall acceptance %
  requestFrequencyPerMonth: number;

  // Transaction preferences
  buyoutPreference: number;  // 0-1
  crashPreference: number;
  swapPreference: number;

  // Flexibility indicators
  flexibilityScore: number;  // 0-100
  accommodationHistory: number;  // Times they accommodated others
  reciprocityRatio: number;  // Given / Received
}

export interface UserArchetype {
  userId: string;
  archetypeType: 'big_spender' | 'high_flexibility' | 'average_user';
  confidence: number;  // 0-1
  signals: ArchetypeSignals;
  lastUpdated: Date;
  reasoning: string[];
}

interface Transaction {
  id: string;
  transaction_type: string;
  status: string;
  proposed_price: number | null;
  base_price: number | null;
  created_at: string;
  responded_at: string | null;
  requester_id: string;
  receiver_id: string;
}

/**
 * Get archetype signals from database for a user
 */
export async function getUserArchetypeSignals(
  supabaseClient: any,
  userId: string
): Promise<ArchetypeSignals> {

  // Fetch transaction history
  const { data: transactions, error: txError } = await supabaseClient
    .from('date_change_requests')
    .select(`
      id,
      transaction_type,
      status,
      proposed_price,
      base_price,
      created_at,
      responded_at,
      requester_id,
      receiver_id
    `)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (txError) {
    console.error('Failed to fetch transactions:', txError);
    return getDefaultSignals();
  }

  if (!transactions || transactions.length === 0) {
    return getDefaultSignals();
  }

  // Calculate economic signals
  const completedTransactions = transactions.filter((t: Transaction) => t.status === 'accepted');
  const requestedTransactions = transactions.filter((t: Transaction) => t.requester_id === userId);
  const receivedTransactions = transactions.filter((t: Transaction) => t.receiver_id === userId);

  const avgTransactionValue = completedTransactions.length > 0
    ? completedTransactions.reduce((sum: number, t: Transaction) => sum + (t.proposed_price || 0), 0) / completedTransactions.length
    : 0;

  // Calculate willingness to pay (ratio of proposed to base price)
  const willingnessToPay = requestedTransactions.length > 0
    ? requestedTransactions.reduce((sum: number, t: Transaction) => {
        const ratio = (t.base_price ?? 0) > 0 ? (t.proposed_price || 0) / (t.base_price ?? 0) : 1;
        return sum + Math.min(ratio, 2);  // Cap at 2x
      }, 0) / requestedTransactions.length / 2  // Normalize to 0-1
    : 0.5;

  // Calculate price rejection rate
  const priceRejections = requestedTransactions.filter((t: Transaction) =>
    t.status === 'rejected' && (t.proposed_price || 0) > (t.base_price || 0) * 1.2
  ).length;
  const priceRejectionRate = requestedTransactions.length > 0
    ? priceRejections / requestedTransactions.length
    : 0;

  // Calculate behavioral signals
  const responseTimes = receivedTransactions
    .filter((t: Transaction) => t.responded_at && t.created_at)
    .map((t: Transaction) => {
      const created = new Date(t.created_at);
      const responded = new Date(t.responded_at!);
      return (responded.getTime() - created.getTime()) / (1000 * 60 * 60);  // Hours
    });

  const avgResponseTimeHours = responseTimes.length > 0
    ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
    : 24;

  const acceptanceRate = receivedTransactions.length > 0
    ? receivedTransactions.filter((t: Transaction) => t.status === 'accepted').length / receivedTransactions.length
    : 0.5;

  // Calculate request frequency (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentRequests = requestedTransactions.filter((t: Transaction) =>
    new Date(t.created_at) >= ninetyDaysAgo
  ).length;
  const requestFrequencyPerMonth = (recentRequests / 3);  // 90 days = 3 months

  // Calculate transaction preferences
  const buyouts = requestedTransactions.filter((t: Transaction) => t.transaction_type === 'buyout').length;
  const crashes = requestedTransactions.filter((t: Transaction) => t.transaction_type === 'crash').length;
  const swaps = requestedTransactions.filter((t: Transaction) => t.transaction_type === 'swap').length;
  const total = requestedTransactions.length || 1;

  const buyoutPreference = buyouts / total;
  const crashPreference = crashes / total;
  const swapPreference = swaps / total;

  // Calculate flexibility score (0-100)
  // Based on: acceptance rate, swap preference, reciprocity
  const flexibilityScore = Math.min(100, Math.round(
    (acceptanceRate * 40) +
    (swapPreference * 30) +
    ((receivedTransactions.length / Math.max(requestedTransactions.length, 1)) * 30)
  ));

  // Calculate accommodation history
  const accommodationHistory = receivedTransactions.filter((t: Transaction) => t.status === 'accepted').length;

  // Calculate reciprocity ratio
  const reciprocityRatio = requestedTransactions.length > 0
    ? receivedTransactions.filter((t: Transaction) => t.status === 'accepted').length /
      requestedTransactions.filter((t: Transaction) => t.status === 'accepted').length
    : 1;

  return {
    avgTransactionValue,
    willingnessToPay: Math.max(0, Math.min(1, willingnessToPay)),
    priceRejectionRate: Math.max(0, Math.min(1, priceRejectionRate)),
    avgResponseTimeHours: Math.max(0.1, avgResponseTimeHours),
    acceptanceRate: Math.max(0, Math.min(1, acceptanceRate)),
    requestFrequencyPerMonth,
    buyoutPreference,
    crashPreference,
    swapPreference,
    flexibilityScore,
    accommodationHistory,
    reciprocityRatio: Math.max(0, reciprocityRatio)
  };
}

/**
 * Detect user archetype based on signals
 */
export function detectUserArchetype(signals: ArchetypeSignals): UserArchetype {

  const reasoning: string[] = [];
  let bigSpenderScore = 0;
  let highFlexScore = 0;
  let averageScore = 50;  // Base score for average

  // ECONOMIC SIGNALS (40% weight)

  // Average transaction value
  if (signals.avgTransactionValue > 1000) {
    bigSpenderScore += 30;
    reasoning.push(`High average transaction value ($${signals.avgTransactionValue.toFixed(0)})`);
  } else if (signals.avgTransactionValue < 300) {
    highFlexScore += 20;
    reasoning.push(`Low average transaction value ($${signals.avgTransactionValue.toFixed(0)})`);
  }

  // Willingness to pay
  if (signals.willingnessToPay > 0.7) {
    bigSpenderScore += 25;
    reasoning.push(`High willingness to pay (${(signals.willingnessToPay * 100).toFixed(0)}%)`);
  } else if (signals.willingnessToPay < 0.4) {
    highFlexScore += 25;
    reasoning.push(`Cost-conscious behavior (${(signals.willingnessToPay * 100).toFixed(0)}% WTP)`);
  }

  // Price rejection rate
  if (signals.priceRejectionRate < 0.3) {
    bigSpenderScore += 15;
    reasoning.push(`Low price sensitivity (${(signals.priceRejectionRate * 100).toFixed(0)}% rejection rate)`);
  } else if (signals.priceRejectionRate > 0.6) {
    highFlexScore += 20;
    reasoning.push(`High price sensitivity (${(signals.priceRejectionRate * 100).toFixed(0)}% rejection rate)`);
  }

  // BEHAVIORAL SIGNALS (35% weight)

  // Response time (lower = more engaged)
  if (signals.avgResponseTimeHours > 3) {
    bigSpenderScore += 15;
    reasoning.push(`Deliberate decision-making (${signals.avgResponseTimeHours.toFixed(1)}hr avg response)`);
  } else if (signals.avgResponseTimeHours < 2) {
    highFlexScore += 25;
    reasoning.push(`Quick to respond (${signals.avgResponseTimeHours.toFixed(1)}hr avg response)`);
  }

  // Acceptance rate
  if (signals.acceptanceRate < 0.5) {
    bigSpenderScore += 15;
    reasoning.push(`Selective acceptance (${(signals.acceptanceRate * 100).toFixed(0)}%)`);
  } else if (signals.acceptanceRate > 0.7) {
    highFlexScore += 20;
    reasoning.push(`High acceptance rate (${(signals.acceptanceRate * 100).toFixed(0)}%)`);
  }

  // Request frequency
  if (signals.requestFrequencyPerMonth > 2) {
    bigSpenderScore += 10;
    reasoning.push(`Frequent requester (${signals.requestFrequencyPerMonth.toFixed(1)}/month)`);
  }

  // FLEXIBILITY SIGNALS (25% weight)

  // Flexibility score
  if (signals.flexibilityScore < 40) {
    bigSpenderScore += 20;
    reasoning.push(`Low flexibility score (${signals.flexibilityScore})`);
  } else if (signals.flexibilityScore > 70) {
    highFlexScore += 30;
    reasoning.push(`High flexibility score (${signals.flexibilityScore})`);
  }

  // Accommodation history
  if (signals.accommodationHistory > 10) {
    highFlexScore += 15;
    reasoning.push(`Frequently accommodates others (${signals.accommodationHistory} times)`);
  }

  // Reciprocity ratio
  if (signals.reciprocityRatio < 0.5) {
    bigSpenderScore += 10;
    reasoning.push(`Low reciprocity (ratio: ${signals.reciprocityRatio.toFixed(2)})`);
  } else if (signals.reciprocityRatio > 1.5) {
    highFlexScore += 15;
    reasoning.push(`High reciprocity (ratio: ${signals.reciprocityRatio.toFixed(2)})`);
  }

  // TRANSACTION PREFERENCE (bonus points)

  if (signals.buyoutPreference > 0.6) {
    bigSpenderScore += 10;
    reasoning.push(`Prefers buyouts (${(signals.buyoutPreference * 100).toFixed(0)}%)`);
  }

  if (signals.swapPreference > 0.5) {
    highFlexScore += 10;
    reasoning.push(`Prefers swaps (${(signals.swapPreference * 100).toFixed(0)}%)`);
  }

  // Normalize scores
  const totalScore = bigSpenderScore + highFlexScore + averageScore;
  const normalizedScores = {
    big_spender: bigSpenderScore / 100,
    high_flexibility: highFlexScore / 100,
    average_user: averageScore / 100
  };

  // Select winner
  const winner = Object.entries(normalizedScores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );

  // Calculate confidence (margin between first and second)
  const sortedScores = Object.values(normalizedScores).sort((a, b) => b - a);
  const margin = sortedScores[0] - sortedScores[1];

  // Reduce confidence for new users with no meaningful transaction history
  // New users have avgTransactionValue = 0 and requestFrequencyPerMonth = 0
  const isNewUser = signals.avgTransactionValue === 0 && signals.requestFrequencyPerMonth === 0;
  let confidence = Math.min(0.95, Math.max(0.4, margin + 0.5));

  if (isNewUser) {
    // New users should have low confidence (max 0.6)
    confidence = Math.min(0.6, confidence);
  }

  return {
    userId: '',  // Will be set by caller
    archetypeType: winner[0] as 'big_spender' | 'high_flexibility' | 'average_user',
    confidence,
    signals,
    lastUpdated: new Date(),
    reasoning: reasoning.slice(0, 5)  // Top 5 reasons
  };
}

/**
 * Get default signals for users with no history
 */
function getDefaultSignals(): ArchetypeSignals {
  return {
    avgTransactionValue: 0,
    willingnessToPay: 0.5,
    priceRejectionRate: 0.5,
    avgResponseTimeHours: 24,
    acceptanceRate: 0.5,
    requestFrequencyPerMonth: 0,
    buyoutPreference: 0.33,
    crashPreference: 0.33,
    swapPreference: 0.34,
    flexibilityScore: 50,
    accommodationHistory: 0,
    reciprocityRatio: 1
  };
}

/**
 * Get archetype label for UI display
 */
export function getArchetypeLabel(archetypeType: string): string {
  const labels: Record<string, string> = {
    'big_spender': 'Premium Booker',
    'high_flexibility': 'Flexible Scheduler',
    'average_user': 'Standard User'
  };
  return labels[archetypeType] || 'Standard User';
}

/**
 * Get archetype description
 */
export function getArchetypeDescription(archetypeType: string): string {
  const descriptions: Record<string, string> = {
    'big_spender': 'Users who prioritize convenience and are willing to pay premium prices for guaranteed access.',
    'high_flexibility': 'Users who prefer fair exchanges and are highly accommodating with schedule changes.',
    'average_user': 'Users with balanced preferences between cost and convenience.'
  };
  return descriptions[archetypeType] || descriptions.average_user;
}
