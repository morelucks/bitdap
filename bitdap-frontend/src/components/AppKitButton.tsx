/**
 * AppKit Button Component
 * Displays connect/disconnect button with account preview
 */

'use client';

import React, { useState } from 'react';
import { useAppKit } from '@hooks/useAppKit';
import { useAccount } from '@hooks/useAccount';
import styles from './AppKitButton.module.css';

export function AppKitButton() {
  const { isConnected, connect, disconnect, isLoading } = useAppKit();
  const { address, formatAddress } = useAccount();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  if (isConnected && address) {
    return (
      <div className={styles.container}>
        <button
          className={styles.button}
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
        >
          {formatAddress(address)}
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button onClick={handleDisconnect} className={styles.menuItem}>
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className={styles.button}
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
