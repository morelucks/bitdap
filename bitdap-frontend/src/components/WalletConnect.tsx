'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import styles from './WalletConnect.module.css';

export function WalletConnect() {
  const { address, network, isConnected, isConnecting, connect, disconnect, switchNetwork } = useWallet();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkLabel = (net: string) => {
    return net === 'mainnet' ? 'Stacks Mainnet' : 'Stacks Testnet';
  };

  return (
    <div className={styles.walletContainer}>
      <div className={styles.networkSelector}>
        <label htmlFor="network-select">Network:</label>
        <select
          id="network-select"
          value={network}
          onChange={(e) => switchNetwork(e.target.value as 'mainnet' | 'testnet')}
          disabled={isConnected}
          className={styles.networkSelect}
        >
          <option value="testnet">Stacks Testnet</option>
          <option value="mainnet">Stacks Mainnet</option>
        </select>
      </div>

      {isConnected && address ? (
        <div className={styles.connectedContainer}>
          <div className={styles.addressInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Connected Address:</span>
              <span className={styles.value} title={address}>
                {truncateAddress(address)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Network:</span>
              <span className={styles.value}>{getNetworkLabel(network)}</span>
            </div>
          </div>
          <button
            onClick={disconnect}
            className={styles.disconnectButton}
            disabled={isConnecting}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className={styles.connectButton}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
