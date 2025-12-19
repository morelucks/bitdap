"use client";

import { useState } from "react";
import { useBitdapContract } from "@hooks/useBitdapContract";
import { useWallet } from "@context/WalletContext";
import { useChainhooks } from "@hooks/useChainhooks";
import styles from "./MintPass.module.css";

const TIERS = [
  { value: 1, label: "Basic" },
  { value: 2, label: "Pro" },
  { value: 3, label: "VIP" },
];

export function MintPass() {
  const { isConnected, address } = useWallet();
  const { mintPass, loading, error } = useBitdapContract();
  const { addEvent } = useChainhooks();
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
      const txId = (result as any)?.txId || (result as any)?.txid || "pending";
      setSuccess(`Pass minted! Transaction: ${txId}`);
      
      // Add event to chainhooks (will be confirmed by webhook later)
      if (address) {
        addEvent({
          event: "mint-event",
          tokenId: 0, // Will be updated by webhook
          owner: address,
          tier,
          timestamp: new Date().toISOString(),
          txId: typeof txId === "string" ? txId : undefined,
        });
      }
      
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

