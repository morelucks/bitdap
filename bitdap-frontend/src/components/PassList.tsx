"use client";

import { useState, useEffect } from "react";
import { useBitdapRead } from "@hooks/useBitdapRead";
import { useBitdapContract } from "@hooks/useBitdapContract";
import { useWallet } from "@context/WalletContext";
import { contractsConfig } from "@config/contracts";
import styles from "./PassList.module.css";

const TIER_NAMES: Record<number, string> = {
  1: "Basic",
  2: "Pro",
  3: "VIP",
};

export function PassList() {
  const { address, isConnected } = useWallet();
  const { getTotalSupply, getNextTokenId, getTierSupply, isPaused } = useBitdapRead();
  const { transfer, burn, loading } = useBitdapContract();
  const [stats, setStats] = useState<any>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [burnTokenId, setBurnTokenId] = useState("");

  useEffect(() => {
    if (isConnected) {
      loadStats();
    }
  }, [isConnected]);

  const loadStats = async () => {
    try {
      const [totalSupply, nextTokenId, basicSupply, proSupply, vipSupply, pausedStatus] =
        await Promise.all([
          getTotalSupply(),
          getNextTokenId(),
          getTierSupply(1),
          getTierSupply(2),
          getTierSupply(3),
          isPaused(),
        ]);

      setStats({
        totalSupply: totalSupply?.value?.value || 0,
        nextTokenId: nextTokenId?.value?.value || 0,
        basicSupply: basicSupply?.value?.value || 0,
        proSupply: proSupply?.value?.value || 0,
        vipSupply: vipSupply?.value?.value || 0,
      });

      setPaused(pausedStatus?.value || false);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleTransfer = async () => {
    if (!transferTokenId || !transferRecipient) {
      alert("Please enter token ID and recipient");
      return;
    }

    const result = await transfer(Number(transferTokenId), transferRecipient);
    if (result) {
      setTransferTokenId("");
      setTransferRecipient("");
      alert(`Transfer initiated! Transaction: ${result.txId}`);
    }
  };

  const handleBurn = async () => {
    if (!burnTokenId) {
      alert("Please enter token ID");
      return;
    }

    if (!confirm(`Are you sure you want to burn token #${burnTokenId}?`)) {
      return;
    }

    const result = await burn(Number(burnTokenId));
    if (result) {
      setBurnTokenId("");
      alert(`Burn initiated! Transaction: ${result.txId}`);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.card}>
        <h3>Pass Statistics</h3>
        <p className={styles.muted}>Connect your wallet to view statistics</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>Collection Statistics</h3>
        {paused && (
          <div className={styles.warning}>
            ⚠️ Contract is currently paused
          </div>
        )}
        {stats && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Total Supply</div>
              <div className={styles.statValue}>{stats.totalSupply}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Next Token ID</div>
              <div className={styles.statValue}>{stats.nextTokenId}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Basic</div>
              <div className={styles.statValue}>{stats.basicSupply}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Pro</div>
              <div className={styles.statValue}>{stats.proSupply}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>VIP</div>
              <div className={styles.statValue}>{stats.vipSupply}</div>
            </div>
          </div>
        )}
        <button onClick={loadStats} className={styles.refreshBtn} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className={styles.card}>
        <h3>Transfer Pass</h3>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Token ID</label>
            <input
              type="number"
              value={transferTokenId}
              onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="1"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Recipient Address</label>
            <input
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              placeholder="SP..."
              className={styles.input}
            />
          </div>
          <button
            onClick={handleTransfer}
            disabled={loading || paused}
            className={styles.button}
          >
            {loading ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Burn Pass</h3>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Token ID</label>
            <input
              type="number"
              value={burnTokenId}
              onChange={(e) => setBurnTokenId(e.target.value)}
              placeholder="1"
              className={styles.input}
            />
          </div>
          <button
            onClick={handleBurn}
            disabled={loading}
            className={styles.dangerButton}
          >
            {loading ? "Burning..." : "Burn Pass"}
          </button>
        </div>
      </div>
    </div>
  );
}

