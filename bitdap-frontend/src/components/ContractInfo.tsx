'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { contractsConfig } from '@/config/contracts';
import styles from './ContractInfo.module.css';

interface ContractDetails {
  name: string;
  address: string;
  explorerUrl: string;
  description?: string;
}

export function ContractInfo() {
  const { network } = useWallet();

  const contracts: ContractDetails[] = [
    {
      name: 'Bitdap Pass',
      address: contractsConfig.bitdap.address,
      explorerUrl: contractsConfig.bitdap.explorerUrl,
      description: 'NFT membership pass contract with tiered access (Basic, Pro, VIP)',
    },
    {
      name: 'Bitdap Token',
      address: contractsConfig.bitdapToken.address,
      explorerUrl: contractsConfig.bitdapToken.explorerUrl,
      description: 'Fungible token contract (SIP-010 compliant)',
    },
  ];

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const getNetworkLabel = (net: string) => {
    return net === 'mainnet' ? 'Stacks Mainnet' : 'Stacks Testnet';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Smart Contracts</h2>
        <span className={styles.networkBadge}>
          {getNetworkLabel(network)}
        </span>
      </div>

      <div className={styles.contractsGrid}>
        {contracts.map((contract) => (
          <div key={contract.name} className={styles.contractCard}>
            <div className={styles.cardHeader}>
              <h3>{contract.name}</h3>
              <a
                href={contract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.explorerLink}
                title="View on Hiro Explorer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {contract.description && (
              <p className={styles.description}>{contract.description}</p>
            )}

            <div className={styles.addressSection}>
              <label className={styles.label}>Contract Address</label>
              <div className={styles.addressContainer}>
                <code className={styles.address} title={contract.address}>
                  {contract.address}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contract.address);
                  }}
                  className={styles.copyButton}
                  title="Copy address"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.linksSection}>
              <a
                href={contract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryLink}
              >
                View on Explorer →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.infoBox}>
        <h4>Network Information</h4>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Current Network:</span>
            <span className={styles.infoValue}>{getNetworkLabel(network)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Explorer:</span>
            <a
              href={contractsConfig.explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.infoLink}
            >
              {contractsConfig.explorerBase}
            </a>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>API Base:</span>
            <a
              href={contractsConfig.apiBase}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.infoLink}
            >
              {contractsConfig.apiBase}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
