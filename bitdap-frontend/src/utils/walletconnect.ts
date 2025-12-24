// WalletConnect utility functions

import { NetworkConfig } from '@/types/walletconnect';

export const STACKS_NETWORKS: Record<'mainnet' | 'testnet', NetworkConfig> = {
  mainnet: {
    network: 'mainnet',
    chainId: 1,
    rpcUrl: 'https://api.hiro.so',
    explorerUrl: 'https://explorer.hiro.so',
    namespace: 'stacks:1',
  },
  testnet: {
    network: 'testnet',
    chainId: 2147483648,
    rpcUrl: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so?chain=testnet',
    namespace: 'stacks:2147483648',
  },
};

export function getNetworkConfig(network: 'mainnet' | 'testnet'): NetworkConfig {
  return STACKS_NETWORKS[network];
}

export function getChainId(network: 'mainnet' | 'testnet'): number {
  return STACKS_NETWORKS[network].chainId;
}

export function getNamespace(network: 'mainnet' | 'testnet'): string {
  return STACKS_NETWORKS[network].namespace;
}

export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses start with 'S' and are 34 characters long
  return /^S[A-Z0-9]{33}$/.test(address);
}

export function extractAddressFromNamespace(account: string): string {
  // Format: "stacks:1:address" or "stacks:2147483648:address"
  const parts = account.split(':');
  return parts[parts.length - 1];
}

export function formatNamespaceAccount(network: 'mainnet' | 'testnet', address: string): string {
  const namespace = getNamespace(network);
  return `${namespace}:${address}`;
}
