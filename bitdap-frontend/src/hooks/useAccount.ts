/**
 * useAccount Hook
 * Provides account-specific operations and information
 */

'use client';

import { useAppKitContext } from '@context/AppKitContext';
import { useCallback } from 'react';

export function useAccount() {
  const context = useAppKitContext();

  const copyAddress = useCallback(async () => {
    if (context.account) {
      await navigator.clipboard.writeText(context.account);
      return true;
    }
    return false;
  }, [context.account]);

  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    address: context.account,
    balance: context.balance,
    isConnected: context.isConnected,
    isLoading: context.isLoading,
    copyAddress,
    formatAddress,
  };
}
