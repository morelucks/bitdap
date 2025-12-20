'use client';

import { useState } from 'react';
import styles from './PurchaseModal.module.css';

interface PurchaseModalProps {
  isOpen: boolean;
  listing: {
    listingId: number;
    tokenId: number;
    seller: string;
    price: number;
  };
  feePercent: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function PurchaseModal({
  isOpen,
  listing,
  feePercent,
  onConfirm,
  onCancel,
}: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const feeAmount = (listing.price * feePercent) / 100;
  const totalAmount = listing.price + feeAmount;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      setSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onCancel();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Confirm Purchase</h2>
          <button className={styles.closeBtn} onClick={onCancel}>
            ✕
          </button>
        </div>

        {success ? (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <h3>Purchase Successful!</h3>
            <p>Your NFT has been transferred to your wallet.</p>
          </div>
        ) : (
          <>
            <div className={styles.content}>
              <div className={styles.listingInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Token ID</span>
                  <span className={styles.value}>#{listing.tokenId}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Seller</span>
                  <span className={styles.value}>
                    {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                  </span>
                </div>
              </div>

              <div className={styles.feeBreakdown}>
                <h3>Price Breakdown</h3>
                <table className={styles.breakdownTable}>
                  <tbody>
                    <tr>
                      <td>Listing Price</td>
                      <td>{(listing.price / 1000000).toFixed(6)} STX</td>
                    </tr>
                    <tr>
                      <td>Marketplace Fee ({feePercent}%)</td>
                      <td>{(feeAmount / 1000000).toFixed(6)} STX</td>
                    </tr>
                    <tr className={styles.totalRow}>
                      <td>Total Amount</td>
                      <td>{(totalAmount / 1000000).toFixed(6)} STX</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.disclaimer}>
                <p>
                  By confirming, you agree to purchase this NFT and pay the total amount
                  including marketplace fees.
                </p>
              </div>
            </div>

            <div className={styles.footer}>
              <button
                className={styles.cancelBtn}
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
