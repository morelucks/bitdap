/**
 * Transaction Status Component
 * Displays transaction status and details
 */

'use client';

import React from 'react';
import { useNetwork } from '@hooks/useNetwork';
import styles from './TransactionStatus.module.css';

export interface TransactionStatusProps {
  txId: string | null;
  status: 'pending' | 'confirmed' | 'failed' | null;
  error?: Error | null;
  onClose?: () => void;
}

export function TransactionStatus({
  txId,
  status,
  error,
  onClose,
}: TransactionStatusProps) {
  const { getExplorerUrl } = useNetwork();

  if (!status) {
    return null;
  }

  const explorerUrl = txId ? getExplorerUrl(txId) : null;

  const statusConfig = {
    pending: {
      icon: '⏳',
      title: 'Transaction Pending',
      color: 'warning',
      message: 'Your transaction is being processed...',
    },
    confirmed: {
      icon: '✓',
      title: 'Transaction Confirmed',
      color: 'success',
      message: 'Your transaction has been confirmed on the blockchain.',
    },
    failed: {
      icon: '✕',
      title: 'Transaction Failed',
      color: 'error',
      message: error?.message || 'Your transaction failed. Please try again.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${styles.container} ${styles[config.color]}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.icon}>{config.icon}</span>
          <h3 className={styles.title}>{config.title}</h3>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <p className={styles.message}>{config.message}</p>

        {txId && (
          <div className={styles.txDetails}>
            <label className={styles.label}>Transaction ID</label>
            <div className={styles.txIdContainer}>
              <code className={styles.txId}>{txId}</code>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.explorerLink}
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorDetails}>
            <label className={styles.label}>Error Details</label>
            <pre className={styles.errorMessage}>{error.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
