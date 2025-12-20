"use client";

import { WalletButton } from "@components/WalletButton";
import { MintPass } from "@components/MintPass";
import { PassList } from "@components/PassList";
import { AdminPanel } from "@components/AdminPanel";
import { EventFeed } from "@components/EventFeed";
'use client';

import { contractsConfig, formatNetworkLabel } from "@config/contracts";
import styles from "./page.module.css";
import { ContractInfo } from "@/components/ContractInfo";

const sections = [
  {
    title: "Network",
    rows: [
      {
        label: "Network",
        value: formatNetworkLabel(contractsConfig.network)
      },
      {
        label: "Explorer Base",
        value: contractsConfig.explorerBase
      },
      {
        label: "Hiro API",
        value: contractsConfig.apiBase
      }
    ]
  },
  {
    title: "Contracts",
    rows: [
      {
        label: "bitdap",
        value: contractsConfig.bitdap.address,
        link: contractsConfig.bitdap.explorerUrl
      },
      {
        label: "bitdap-token",
        value: contractsConfig.bitdapToken.address,
        link: contractsConfig.bitdapToken.explorerUrl
      }
    ]
  }
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bitdap Pass</h1>
          <p className={styles.subtitle}>
            Tiered membership NFT collection on {formatNetworkLabel(contractsConfig.network)}
          </p>
        </div>
        <WalletButton />
      </header>
    <main className="page">
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="pill">Bitdap Frontend Scaffold</div>
        <span className="small">
          Update .env.local with contract addresses and network.
        </span>
      </div>

      <ContractInfo />

      <div className={styles.infoSection}>
        <div className={styles.card}>
          <h3>Contract Information</h3>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.label}>Network</div>
              <div className={styles.value}>{formatNetworkLabel(contractsConfig.network)}</div>
            </div>
            <div>
              <div className={styles.label}>Bitdap Contract</div>
              <a
                href={contractsConfig.bitdap.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {contractsConfig.bitdap.address}
              </a>
            </div>
            <div>
              <div className={styles.label}>Token Contract</div>
              <a
                href={contractsConfig.bitdapToken.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {contractsConfig.bitdapToken.address}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <EventFeed />
        <MintPass />
        <PassList />
        <AdminPanel />
      </div>
    </main>
  );
}
