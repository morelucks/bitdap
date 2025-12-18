"use client";

import { useState } from "react";
import { useBitdapContract } from "@hooks/useBitdapContract";
import { useWallet } from "@context/WalletContext";
import styles from "./MintPass.module.css";

const TIERS = [
  { value: 1, label: "Basic" },
  { value: 2, label: "Pro" },
  { value: 3, label: "VIP" },
];

export function MintPass() {
  const { isConnected } = useWallet();
  const { mintPass, loading, error } = useBitdapContract();
  const [tier, setTier] = useState<number>(1);
  const [uri, setUri] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleMint = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setSuccess(null);
    const result = await mintPass(tier, uri || undefined);
    if (result) {
      setSuccess(`Pass minted! Transaction: ${result.txId}`);
      setUri("");
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.card}>
        <h3>Mint Pass</h3>
        <p className={styles.muted}>Connect your wallet to mint a Bitdap Pass</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3>Mint Bitdap Pass</h3>
      <div className={styles.form}>
        <div className={styles.field}>
          <label>Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
            className={styles.select}
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Metadata URI (optional)</label>
          <input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="https://..."
            className={styles.input}
          />
        </div>

        <button
          onClick={handleMint}
          disabled={loading}
          className={styles.button}
        >
          {loading ? "Minting..." : "Mint Pass"}
        </button>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
      </div>
    </div>
  );
}

