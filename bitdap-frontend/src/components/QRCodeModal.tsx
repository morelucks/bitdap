'use client';

import React, { useEffect, useState } from 'react';
import styles from './QRCodeModal.module.css';

interface QRCodeModalProps {
  isOpen: boolean;
  uri: string | null;
  onClose: () => void;
  onTimeout?: () => void;
}

export function QRCodeModal({ isOpen, uri, onClose, onTimeout }: QRCodeModalProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onTimeout]);

  const handleCopyUri = async () => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URI:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Connect Your Wallet</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.qrContainer}>
            <div className={styles.qrPlaceholder}>
              {/* QR code will be rendered here */}
              <p>QR Code</p>
              <p className={styles.uriText}>{uri?.substring(0, 20)}...</p>
            </div>
          </div>

          <div className={styles.instructions}>
            <p>1. Open your wallet app</p>
            <p>2. Scan this QR code</p>
            <p>3. Approve the connection</p>
          </div>

          {uri && (
            <div className={styles.uriSection}>
              <p className={styles.uriLabel}>Or paste this URI:</p>
              <div className={styles.uriBox}>
                <code className={styles.uriCode}>{uri}</code>
                <button
                  className={styles.copyButton}
                  onClick={handleCopyUri}
                  aria-label="Copy URI to clipboard"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.timer}>
            <div className={styles.timerBar} style={{ width: `${(timeLeft / 30) * 100}%` }} />
            <p>Expires in {timeLeft}s</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
