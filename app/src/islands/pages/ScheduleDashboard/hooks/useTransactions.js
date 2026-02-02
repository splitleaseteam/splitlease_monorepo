/**
 * Transactions Hook for ScheduleDashboard
 * @module hooks/useTransactions
 *
 * Manages transaction state.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 *
 * NOTE: The `transactionsByDate` computed value (useMemo) remains in the main
 * useScheduleDashboardLogic.js hook since it's a derived value that depends
 * on the transactions array returned by this hook.
 */

import { useState } from 'react';

/**
 * Hook for managing transaction state in ScheduleDashboard
 * @returns {object} Transaction state and setters
 */
export function useTransactions() {
  // -------------------------------------------------------------------------
  // TRANSACTION STATE
  // -------------------------------------------------------------------------
  const [transactions, setTransactions] = useState([]);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // State
    transactions,

    // Direct setters (for cross-hook coordination)
    setTransactions,
  };
}
