/**
 * Account Display Component
 * Shows connected account information
 */

'use client';

import React from 'react';
import { useAccount } from '@hooks/useAccount';
import { useNetwork } from '@hooks/useNetwork';
import styles from './AccountDisplay.module.css';

export function AccountDisplay() {
  const { address, balance, isConnected, copyAddress, formatAddress } = useAccount();
  const { currentNetwork } = useNetwork();
  const [copied, setCopied] = React.useState(false);

  if (!isConnected || !address) {
    return null;
  }

  const handleCopy = async () => {
    const success = await copyAddress();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>Connected Account</h3>
          <span className={styles.network}>{currentNetwork.name}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.addressSection}>
            <label className={styles.label}>Address</label>
            <div className={styles.addressContainer}>
              <code className={styles.address}>{address}</code>
              <button
                className={styles.copyButton}
                onClick={handleCopy}
                title="Copy address"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {balance && (
            <div className={styles.balanceSection}>
              <label className={styles.label}>Balance</label>
              <div className={styles.balance}>{balance} STX</div>
            </div>
          )}

          <div className={styles.shortAddress}>
            <label className={styles.label}>Short Address</label>
            <code className={styles.address}>{formatAddress(address)}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
