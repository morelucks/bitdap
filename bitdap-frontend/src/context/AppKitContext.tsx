/**
 * AppKit Context
 * Provides AppKit connection state and utilities to the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AppKitContextType {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  network: string;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

const AppKitContext = createContext<AppKitContextType | undefined>(undefined);

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState('testnet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize AppKit connection state from localStorage
  useEffect(() => {
    const storedAccount = localStorage.getItem('appkit_account');
    const storedNetwork = localStorage.getItem('appkit_network') || 'testnet';

    if (storedAccount) {
      setAccount(storedAccount);
      setIsConnected(true);
      setNetwork(storedNetwork);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Connection logic will be handled by Web3Modal
      // This is a placeholder for the connection flow
      console.log('Connecting wallet...');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setIsConnected(false);
      setAccount(null);
      setBalance(null);
      localStorage.removeItem('appkit_account');
      localStorage.removeItem('appkit_network');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Disconnection failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const networkName = chainId === 1 ? 'mainnet' : 'testnet';
      setNetwork(networkName);
      localStorage.setItem('appkit_network', networkName);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Network switch failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AppKitContextType = {
    isConnected,
    account,
    balance,
    network,
    isLoading,
    error,
    connect,
    disconnect,
    switchNetwork,
  };

  return <AppKitContext.Provider value={value}>{children}</AppKitContext.Provider>;
}

export function useAppKitContext() {
  const context = useContext(AppKitContext);
  if (context === undefined) {
    throw new Error('useAppKitContext must be used within AppKitProvider');
  }
  return context;
}
