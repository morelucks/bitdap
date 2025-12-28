/**
 * Network Switcher Component
 * Allows users to switch between Stacks networks
 */

'use client';

import React, { useState } from 'react';
import { useNetwork } from '@hooks/useNetwork';
import styles from './NetworkSwitcher.module.css';

export function NetworkSwitcher() {
  const { network, currentNetwork, switchToMainnet, switchToTestnet, isLoading } = useNetwork();
  const [showMenu, setShowMenu] = useState(false);

  const handleSwitchMainnet = async () => {
    try {
      await switchToMainnet();
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to switch to mainnet:', error);
    }
  };

  const handleSwitchTestnet = async () => {
    try {
      await switchToTestnet();
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to switch to testnet:', error);
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
      >
        <span className={styles.indicator}></span>
        {currentNetwork.name}
      </button>

      {showMenu && (
        <div className={styles.menu}>
          <button
            className={`${styles.menuItem} ${network === 'mainnet' ? styles.active : ''}`}
            onClick={handleSwitchMainnet}
            disabled={isLoading}
          >
            <span className={styles.menuIndicator}></span>
            Stacks Mainnet
          </button>
          <button
            className={`${styles.menuItem} ${network === 'testnet' ? styles.active : ''}`}
            onClick={handleSwitchTestnet}
            disabled={isLoading}
          >
            <span className={styles.menuIndicator}></span>
            Stacks Testnet
          </button>
        </div>
      )}
    </div>
  );
}
