'use client';

import React from 'react';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import styles from './WalletConnectButton.module.css';

interface WalletConnectButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onError?: (error: string) => void;
}

export function WalletConnectButton({
  variant = 'primary',
  size = 'md',
  onConnect,
  onError,
}: WalletConnectButtonProps) {
  const { isConnected, isConnecting, error, connect, disconnect } = useWalletConnect();

  const handleClick = async () => {
    try {
      if (isConnected) {
        await disconnect();
      } else {
        await connect();
        onConnect?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      onError?.(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleClick}
        disabled={isConnecting}
        className={`${styles.button} ${styles[variant]} ${styles[size]}`}
        aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet with WalletConnect'}
      >
        {isConnecting ? (
          <>
            <span className={styles.spinner} />
            Connecting...
          </>
        ) : isConnected ? (
          'Disconnect'
        ) : (
          'Connect with WalletConnect'
        )}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
