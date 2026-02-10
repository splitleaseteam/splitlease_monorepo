import { useMemo } from 'react';

/**
 * @param {Array} transactions - Processed transactions array.
 * @returns {Object} Summary data for flexibility score, net flow, and transactions by date.
 */
export function useTransactionSummary(transactions = []) {
  const flexibilityScore = useMemo(() => calculateFlexibilityScore(transactions), [transactions]);
  const netFlow = useMemo(() => calculateNetFlow(transactions), [transactions]);
  const transactionsByDate = useMemo(() => buildTransactionsByDate(transactions), [transactions]);

  return { flexibilityScore, netFlow, transactionsByDate };
}

function calculateFlexibilityScore(transactions) {
  if (!transactions || transactions.length === 0) return 5;

  const completed = transactions.filter((t) => t.status === 'complete').length;
  const declined = transactions.filter((t) => t.status === 'declined').length;
  const total = completed + declined;

  if (total === 0) return 5;

  const acceptanceRate = completed / total;
  return Math.round(acceptanceRate * 10);
}

function calculateNetFlow(transactions) {
  if (!transactions || transactions.length === 0) {
    return { amount: 0, direction: 'neutral', formatted: '$0.00' };
  }

  const completedTxns = transactions.filter((t) => t.status === 'complete' && t.type === 'full_week');

  let netAmount = 0;
  for (const txn of completedTxns) {
    if (txn.direction === 'outgoing') {
      netAmount -= txn.amount;
    } else if (txn.direction === 'incoming') {
      netAmount += txn.amount;
    }
  }

  return {
    amount: Math.abs(netAmount),
    direction: netAmount > 0 ? 'positive' : netAmount < 0 ? 'negative' : 'neutral',
    formatted: netAmount >= 0 ? `+$${Math.abs(netAmount).toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
  };
}

function buildTransactionsByDate(transactions) {
  const map = {};
  if (!transactions || transactions.length === 0) return map;

  transactions.forEach((transaction) => {
    if (!transaction?.date) return;
    const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    map[dateKey] = transaction;
  });

  return map;
}
