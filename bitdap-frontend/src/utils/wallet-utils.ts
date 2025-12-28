/**
 * Wallet Utilities
 * Helper functions for wallet operations
 */

export interface WalletInfo {
  name: string;
  installed: boolean;
  installUrl: string;
  icon: string;
}

export const SUPPORTED_WALLETS: Record<string, WalletInfo> = {
  hiro: {
    name: 'Hiro Wallet',
    installed: typeof window !== 'undefined' && !!(window as any).HiroWallet,
    installUrl: 'https://wallet.hiro.so',
    icon: '🔐',
  },
  leather: {
    name: 'Leather Wallet',
    installed: typeof window !== 'undefined' && !!(window as any).LeatherProvider,
    installUrl: 'https://leather.io',
    icon: '🧥',
  },
  xverse: {
    name: 'Xverse Wallet',
    installed: typeof window !== 'undefined' && !!(window as any).XverseProvider,
    installUrl: 'https://www.xverse.app',
    icon: '✕',
  },
};

/**
 * Checks if a wallet is installed
 */
export function isWalletInstalled(walletId: string): boolean {
  const wallet = SUPPORTED_WALLETS[walletId];
  return wallet ? wallet.installed : false;
}

/**
 * Gets installation URL for a wallet
 */
export function getWalletInstallUrl(walletId: string): string | null {
  const wallet = SUPPORTED_WALLETS[walletId];
  return wallet ? wallet.installUrl : null;
}

/**
 * Formats a wallet address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validates a Stacks address
 */
export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses start with 'S' or 'SP' for mainnet, 'ST' for testnet
  const stacksAddressRegex = /^(S[A-Z0-9]{33}|SP[A-Z0-9]{32}|ST[A-Z0-9]{32})$/;
  return stacksAddressRegex.test(address);
}

/**
 * Gets the network from an address
 */
export function getNetworkFromAddress(address: string): 'mainnet' | 'testnet' | null {
  if (address.startsWith('ST')) {
    return 'testnet';
  }
  if (address.startsWith('S') || address.startsWith('SP')) {
    return 'mainnet';
  }
  return null;
}

/**
 * Checks if an address is a contract address
 */
export function isContractAddress(address: string): boolean {
  return address.includes('.');
}

/**
 * Gets all installed wallets
 */
export function getInstalledWallets(): WalletInfo[] {
  return Object.values(SUPPORTED_WALLETS).filter((wallet) => wallet.installed);
}

/**
 * Gets all available wallets
 */
export function getAvailableWallets(): WalletInfo[] {
  return Object.values(SUPPORTED_WALLETS);
}
