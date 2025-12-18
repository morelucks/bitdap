import { useMemo } from 'react';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { useWallet } from '@/context/WalletContext';

export function useStacksNetwork() {
  const { network } = useWallet();

  const stacksNetwork = useMemo(() => {
    return network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
  }, [network]);

  return stacksNetwork;
}
