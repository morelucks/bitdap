"use client";

import { useWallet } from "@context/WalletContext";
import styles from "./WalletButton.module.css";

export function WalletButton() {
  const { isConnected, address, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className={styles.walletContainer}>
        <div className={styles.address}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button onClick={disconnect} className={styles.disconnectBtn}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} className={styles.connectBtn}>
      Connect Wallet
    </button>
  );
}

