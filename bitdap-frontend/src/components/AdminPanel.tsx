"use client";

import { useState } from "react";
import { useBitdapContract } from "@hooks/useBitdapContract";
import { useWallet } from "@context/WalletContext";
import { useBitdapRead } from "@hooks/useBitdapRead";
import { useEffect } from "react";
import styles from "./AdminPanel.module.css";

export function AdminPanel() {
  const { address, isConnected } = useWallet();
  const { pause, unpause, setTokenUri, loading, error } = useBitdapContract();
  const { isPaused } = useBitdapRead();
  const [paused, setPaused] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState("");
  const [uri, setUri] = useState("");

  useEffect(() => {
    if (isConnected) {
      loadPausedStatus();
    }
  }, [isConnected]);

  const loadPausedStatus = async () => {
    const result = await isPaused();
    setPaused(result?.value || false);
  };

  const handlePause = async () => {
    const result = await pause();
    if (result) {
      setPaused(true);
      alert("Contract paused successfully");
    }
  };

  const handleUnpause = async () => {
    const result = await unpause();
    if (result) {
      setPaused(false);
      alert("Contract unpaused successfully");
    }
  };

  const handleSetTokenUri = async () => {
    if (!tokenId || !uri) {
      alert("Please enter token ID and URI");
      return;
    }

    const result = await setTokenUri(Number(tokenId), uri);
    if (result) {
      setTokenId("");
      setUri("");
      const txId = (result as any)?.txId || (result as any)?.txid || "pending";
      alert(`Token URI updated! Transaction: ${txId}`);
    }
  };

  // Note: In a real app, you'd check if the address matches the contract owner
  // For now, we'll show the panel to all connected users
  if (!isConnected) {
    return (
      <div className={styles.card}>
        <h3>Admin Panel</h3>
        <p className={styles.muted}>Connect your wallet to access admin functions</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3>Admin Panel</h3>
      <p className={styles.muted}>
        Only the contract owner can use these functions
      </p>

      <div className={styles.section}>
        <h4>Contract Control</h4>
        <div className={styles.status}>
          Status: <span className={paused ? styles.paused : styles.active}>
            {paused ? "Paused" : "Active"}
          </span>
        </div>
        <div className={styles.buttonGroup}>
          <button
            onClick={handlePause}
            disabled={loading || paused}
            className={styles.pauseBtn}
          >
            {loading ? "Pausing..." : "Pause"}
          </button>
          <button
            onClick={handleUnpause}
            disabled={loading || !paused}
            className={styles.unpauseBtn}
          >
            {loading ? "Unpausing..." : "Unpause"}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Update Token URI</h4>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Token ID</label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="1"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Metadata URI</label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="https://..."
              className={styles.input}
            />
          </div>
          <button
            onClick={handleSetTokenUri}
            disabled={loading}
            className={styles.button}
          >
            {loading ? "Updating..." : "Set Token URI"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

