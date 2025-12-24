// WalletConnect types and interfaces

export interface WalletConnectSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  expiry: number;
  namespaces: Record<string, Namespace>;
  requiredNamespaces: Record<string, Namespace>;
  optionalNamespaces?: Record<string, Namespace>;
  controller: string;
  acknowledged: boolean;
}

export interface Namespace {
  chains: string[];
  methods: string[];
  events: string[];
  accounts: string[];
}

export interface NetworkConfig {
  network: 'mainnet' | 'testnet';
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  namespace: string;
}

export interface WalletConnectContextType {
  // Connection state
  isConnected: boolean;
  address: string | null;
  chainId: number;
  
  // Session management
  session: WalletConnectSession | null;
  isConnecting: boolean;
  error: string | null;
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (network: 'mainnet' | 'testnet') => Promise<void>;
  
  // UI state
  showQRCode: boolean;
  qrCodeUri: string | null;
}

export interface StoredSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  expiry: number;
  namespaces: Record<string, Namespace>;
  requiredNamespaces: Record<string, Namespace>;
  optionalNamespaces?: Record<string, Namespace>;
  controller: string;
  acknowledged: boolean;
}

export type WalletConnectionMethod = 'hiro' | 'walletconnect';

export interface WalletState {
  method: WalletConnectionMethod | null;
  address: string | null;
  isConnected: boolean;
  network: 'mainnet' | 'testnet';
}
