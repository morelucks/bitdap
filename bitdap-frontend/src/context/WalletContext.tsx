'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { showConnect } from '@stacks/connect';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';

interface WalletContextType {
  address: string | null;
  network: 'mainnet' | 'testnet';
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
  const [isConnecting, setIsConnecting] = useState(false);

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('bitdap_wallet_address');
    const savedNetwork = (localStorage.getItem('bitdap_network') as 'mainnet' | 'testnet') || 'testnet';
    
    if (savedAddress) {
      setAddress(savedAddress);
    }
    setNetwork(savedNetwork);
  }, []);

  const connect = useCallback(() => {
    setIsConnecting(true);
    
    const stacksNetwork = network === 'mainnet' 
      ? new StacksMainnet()
      : new StacksTestnet();

    showConnect({
      userSession: undefined,
      appDetails: {
        name: 'Bitdap Pass',
        icon: '/bitdap-logo.png',
      },
      onFinish: () => {
        // Get the connected address from the wallet
        const connectedAddress = localStorage.getItem('stacks_session');
        if (connectedAddress) {
          try {
            const session = JSON.parse(connectedAddress);
            const userAddress = session.profile?.stxAddress?.[network === 'mainnet' ? 'mainnet' : 'testnet'];
            
            if (userAddress) {
              setAddress(userAddress);
              localStorage.setItem('bitdap_wallet_address', userAddress);
              localStorage.setItem('bitdap_network', network);
            }
          } catch (error) {
            console.error('Error parsing wallet session:', error);
          }
        }
        setIsConnecting(false);
      },
      onCancel: () => {
        setIsConnecting(false);
      },
    });
  }, [network]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem('bitdap_wallet_address');
    localStorage.removeItem('stacks_session');
  }, []);

  const switchNetwork = useCallback((newNetwork: 'mainnet' | 'testnet') => {
    setNetwork(newNetwork);
    localStorage.setItem('bitdap_network', newNetwork);
    // Disconnect when switching networks
    disconnect();
  }, [disconnect]);

  const value: WalletContextType = {
    address,
    network,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
