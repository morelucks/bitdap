/**
 * useNetwork Hook
 * Provides network switching and information
 */

'use client';

import { useAppKitContext } from '@context/AppKitContext';
import { useCallback } from 'react';

export interface NetworkInfo {
  chainId: number;
  name: string;
  currency: string;
  explorerUrl: string;
  rpcUrl: string;
}

const NETWORKS: Record<string, NetworkInfo> = {
  mainnet: {
    chainId: 1,
    name: 'Stacks Mainnet',
    currency: 'STX',
    explorerUrl: 'https://explorer.stacks.co',
    rpcUrl: 'https://stacks-node-api.mainnet.stacks.co:20443',
  },
  testnet: {
    chainId: 2147483648,
    name: 'Stacks Testnet',
    currency: 'STX',
    explorerUrl: 'https://testnet-explorer.stacks.co',
    rpcUrl: 'https://stacks-node-api.testnet.stacks.co:20443',
  },
};

export function useNetwork() {
  const context = useAppKitContext();

  const currentNetwork = NETWORKS[context.network] || NETWORKS.testnet;

  const switchToMainnet = useCallback(async () => {
    await context.switchNetwork(1);
  }, [context]);

  const switchToTestnet = useCallback(async () => {
    await context.switchNetwork(2147483648);
  }, [context]);

  const getExplorerUrl = useCallback(
    (txId: string) => {
      return `${currentNetwork.explorerUrl}/tx/${txId}`;
    },
    [currentNetwork]
  );

  return {
    network: context.network,
    currentNetwork,
    isLoading: context.isLoading,
    error: context.error,
    switchToMainnet,
    switchToTestnet,
    switchNetwork: context.switchNetwork,
    getExplorerUrl,
  };
}
