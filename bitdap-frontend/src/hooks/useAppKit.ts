/**
 * useAppKit Hook
 * Provides access to AppKit connection state and utilities
 */

'use client';

import { useAppKitContext } from '@context/AppKitContext';

export function useAppKit() {
  const context = useAppKitContext();

  return {
    isConnected: context.isConnected,
    account: context.account,
    balance: context.balance,
    network: context.network,
    isLoading: context.isLoading,
    error: context.error,
    connect: context.connect,
    disconnect: context.disconnect,
    switchNetwork: context.switchNetwork,
  };
}
