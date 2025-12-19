'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useContractRead } from '@/hooks/useContractRead';
import { Cl } from '@stacks/transactions';
import styles from './WalletExample.module.css';

/**
 * Example component demonstrating wallet usage and contract interaction
 */
export function WalletExample() {
  const { address, network, isConnected } = useWallet();
  const [showDetails, setShowDetails] = useState(false);

  const { data: counters, isLoading, execute: getCounters } = useContractRead({
    contractAddress: process.env.NEXT_PUBLIC_BITDAP_CONTRACT || '',
    contractName: 'bitdap',
    functionName: 'get-counters',
    functionArgs: [],
  });

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.message}>
          <p>Connect your wallet to see examples</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>Wallet Information</h3>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Address:</span>
            <span className={styles.value} title={address || ''}>
              {address}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Network:</span>
            <span className={styles.value}>{network}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Contract Interaction Example</h3>
        <p className={styles.description}>
          Click the button below to fetch contract counters (users, listings, transactions)
        </p>
        <button
          onClick={getCounters}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? 'Loading...' : 'Get Counters'}
        </button>

        {counters && (
          <div className={styles.result}>
            <h4>Result:</h4>
            <pre>{JSON.stringify(counters, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3>Integration Guide</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={styles.toggleButton}
        >
          {showDetails ? 'Hide' : 'Show'} Code Examples
        </button>

        {showDetails && (
          <div className={styles.codeExamples}>
            <h4>Using useWallet Hook</h4>
            <pre className={styles.code}>
{`import { useWallet } from '@/context/WalletContext';

export function MyComponent() {
  const { address, network, isConnected, connect } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address} on {network}</p>
      ) : (
        <button onClick={connect}>Connect</button>
      )}
    </div>
  );
}`}
            </pre>

            <h4>Using useContractRead Hook</h4>
            <pre className={styles.code}>
{`import { useContractRead } from '@/hooks/useContractRead';

export function GetData() {
  const { data, isLoading, execute } = useContractRead({
    contractAddress: 'ST1...',
    contractName: 'bitdap',
    functionName: 'get-counters',
    functionArgs: [],
  });

  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Data'}
      </button>
      {data && <pre>{JSON.stringify(data)}</pre>}
    </div>
  );
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
