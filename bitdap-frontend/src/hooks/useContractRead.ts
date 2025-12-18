import { useState, useCallback } from 'react';
import { callReadOnlyFunction, ReadOnlyFunctionOptions } from '@stacks/transactions';
import { useStacksNetwork } from './useStacksNetwork';
import { useWallet } from '@/context/WalletContext';

interface UseContractReadOptions extends Omit<ReadOnlyFunctionOptions, 'network'> {
  enabled?: boolean;
}

export function useContractRead<T = any>(options: UseContractReadOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const network = useStacksNetwork();
  const { address } = useWallet();

  const execute = useCallback(async () => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callReadOnlyFunction({
        ...options,
        network,
        senderAddress: address,
      });

      setData(result as T);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options, network, address]);

  return { data, isLoading, error, execute };
}
