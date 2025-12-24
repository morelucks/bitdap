import { useContext } from 'react';
import { WalletConnectContext } from '@/context/WalletConnectContext';

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (context === undefined) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}
