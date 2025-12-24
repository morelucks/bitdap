'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { WalletConnectContextType, WalletConnectSession } from '@/types/walletconnect';
import { loadSession, saveSession, clearSession, isStorageAvailable } from '@/utils/session-storage';
import { getNetworkConfig, extractAddressFromNamespace } from '@/utils/walletconnect';
import { handleError, logError } from '@/utils/error-handler';

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState(0);
  const [session, setSession] = useState<WalletConnectSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');

  // Initialize WalletConnect on mount
  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        // Check if storage is available
        if (!isStorageAvailable()) {
          console.warn('localStorage is not available');
        }

        // Try to restore session from storage
        const storedSession = loadSession();
        if (storedSession) {
          setSession(storedSession);
          setChainId(storedSession.namespaces.stacks?.chains?.[0]?.split(':')[1] || 0);
          
          // Extract address from accounts
          const accounts = storedSession.namespaces.stacks?.accounts || [];
          if (accounts.length > 0) {
            const addr = extractAddressFromNamespace(accounts[0]);
            setAddress(addr);
            setIsConnected(true);
          }
        }
      } catch (err) {
        const error = handleError(err);
        logError(error);
        setError(error.message);
      }
    };

    initializeWalletConnect();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // This will be implemented with actual WalletConnect SDK
      // For now, this is a placeholder
      console.log('Initiating WalletConnect connection...');
      
      // Simulate QR code generation
      const uri = `wc:${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
      setQrCodeUri(uri);
      setShowQRCode(true);
    } catch (err) {
      const error = handleError(err);
      logError(error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setIsConnected(false);
      setAddress(null);
      setSession(null);
      setChainId(0);
      setError(null);
      clearSession();
    } catch (err) {
      const error = handleError(err);
      logError(error);
      setError(error.message);
    }
  }, []);

  const switchNetwork = useCallback(async (newNetwork: 'mainnet' | 'testnet') => {
    try {
      if (newNetwork === network) return;

      // Disconnect current session
      await disconnect();
      
      // Update network
      setNetwork(newNetwork);
      
      // Clear QR code
      setShowQRCode(false);
      setQrCodeUri(null);
    } catch (err) {
      const error = handleError(err);
      logError(error);
      setError(error.message);
    }
  }, [network, disconnect]);

  const value: WalletConnectContextType = {
    isConnected,
    address,
    chainId,
    session,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    showQRCode,
    qrCodeUri,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (context === undefined) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}
