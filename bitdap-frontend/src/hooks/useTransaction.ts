/**
 * useTransaction Hook
 * Provides transaction handling and monitoring
 */

'use client';

import { useAppKitContext } from '@context/AppKitContext';
import { useState, useCallback } from 'react';

export interface TransactionState {
  txId: string | null;
  status: 'pending' | 'confirmed' | 'failed' | null;
  error: Error | null;
  isLoading: boolean;
}

export function useTransaction() {
  const context = useAppKitContext();
  const [txState, setTxState] = useState<TransactionState>({
    txId: null,
    status: null,
    error: null,
    isLoading: false,
  });

  const sendTransaction = useCallback(
    async (to: string, amount: string, functionName?: string) => {
      if (!context.isConnected || !context.account) {
        throw new Error('Wallet not connected');
      }

      setTxState({
        txId: null,
        status: 'pending',
        error: null,
        isLoading: true,
      });

      try {
        // Transaction sending logic will be implemented
        // This is a placeholder for the transaction flow
        const mockTxId = `0x${Math.random().toString(16).slice(2)}`;

        setTxState({
          txId: mockTxId,
          status: 'pending',
          error: null,
          isLoading: false,
        });

        return mockTxId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Transaction failed');
        setTxState({
          txId: null,
          status: 'failed',
          error,
          isLoading: false,
        });
        throw error;
      }
    },
    [context.isConnected, context.account]
  );

  const resetTransaction = useCallback(() => {
    setTxState({
      txId: null,
      status: null,
      error: null,
      isLoading: false,
    });
  }, []);

  return {
    ...txState,
    sendTransaction,
    resetTransaction,
  };
}
