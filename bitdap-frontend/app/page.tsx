"use client";

import { WalletButton } from "@components/WalletButton";
import { MintPass } from "@components/MintPass";
import { PassList } from "@components/PassList";
import { AdminPanel } from "@components/AdminPanel";
import { contractsConfig, formatNetworkLabel } from "@config/contracts";
import styles from "./page.module.css";

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
        <MintPass />
        <PassList />
        <AdminPanel />
      </div>
    </main>
  );
}
