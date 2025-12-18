'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { contractsConfig } from '@/config/contracts';
import styles from './ContractDetails.module.css';

interface ContractDetail {
  name: string;
  address: string;
  explorerUrl: string;
  type: 'NFT' | 'Token';
  description: string;
  functions: string[];
  network: string;
}

export function ContractDetails() {
  const { network } = useWallet();
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const contracts: ContractDetail[] = [
    {
      name: 'Bitdap Pass',
      address: contractsConfig.bitdap.address,
      explorerUrl: contractsConfig.bitdap.explorerUrl,
      type: 'NFT',
      description: 'Non-fungible token contract for tiered membership passes',
      functions: [
        'mint-pass(tier, uri)',
        'transfer(token-id, recipient)',
        'burn(token-id)',
        'get-owner(token-id)',
        'get-tier(token-id)',
        'get-counters()',
        'get-total-supply()',
      ],
      network: network,
    },
    {
      name: 'Bitdap Token',
      address: contractsConfig.bitdapToken.address,
      explorerUrl: contractsConfig.bitdapToken.explorerUrl,
      type: 'Token',
      description: 'Fungible token contract (SIP-010 compliant)',
      functions: [
        'transfer(amount, sender, recipient, memo)',
        'approve(spender, amount)',
        'transfer-from(owner, recipient, amount, memo)',
        'mint(recipient, amount)',
        'burn(amount)',
        'get-balance(account)',
        'get-total-supply()',
      ],
      network: network,
    },
  ];

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 12)}...${addr.slice(-10)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Contract Details</h2>
        <p className={styles.subtitle}>
          Explore contract information and available functions
        </p>
      </div>

      <div className={styles.contractsList}>
        {contracts.map((contract) => (
          <div key={contract.name} className={styles.contractItem}>
            <div
              className={styles.contractHeader}
              onClick={() =>
                setExpandedContract(
                  expandedContract === contract.name ? null : contract.name
                )
              }
            >
              <div className={styles.contractTitle}>
                <h3>{contract.name}</h3>
                <span className={`${styles.badge} ${styles[contract.type.toLowerCase()]}`}>
                  {contract.type}
                </span>
              </div>
              <div className={styles.expandIcon}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform:
                      expandedContract === contract.name
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {expandedContract === contract.name && (
              <div className={styles.contractContent}>
                <p className={styles.description}>{contract.description}</p>

                <div className={styles.section}>
                  <h4>Contract Address</h4>
                  <div className={styles.addressBox}>
                    <code>{contract.address}</code>
                    <button
                      onClick={() => copyToClipboard(contract.address)}
                      className={styles.copyBtn}
                      title="Copy address"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4>Available Functions</h4>
                  <ul className={styles.functionsList}>
                    {contract.functions.map((func, idx) => (
                      <li key={idx}>
                        <code>{func}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.section}>
                  <h4>Links</h4>
                  <div className={styles.linksBox}>
                    <a
                      href={contract.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      View on Hiro Explorer →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.helpBox}>
        <h3>Need Help?</h3>
        <ul>
          <li>
            <strong>View on Explorer:</strong> Click the contract name or "View on Hiro Explorer" to see full contract details
          </li>
          <li>
            <strong>Copy Address:</strong> Click the "Copy" button to copy contract address to clipboard
          </li>
          <li>
            <strong>Network:</strong> Make sure you're on the correct network (Mainnet/Testnet)
          </li>
          <li>
            <strong>Functions:</strong> Use these function names when calling contracts from your application
          </li>
        </ul>
      </div>
    </div>
  );
}
