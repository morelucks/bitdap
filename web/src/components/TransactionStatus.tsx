import React, { useState, useEffect } from 'react';
import { TransactionService } from '../services/TransactionService';
import { TokenService } from '../services/TokenService';
import { TxStatus, TxDetails } from '../types';

interface TransactionStatusProps {
  txHash?: string;
  transactionService: TransactionService;
  tokenService: TokenService;
  onStatusChange?: (status: TxStatus, details?: TxDetails) => void;
  onRetry?: () => void;
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  txHash,
  transactionService,
  tokenService,
  onStatusChange,
  onRetry,
  className = '',
}) => {
  const [status, setStatus] = useState<TxStatus>(TxStatus.PENDING);
  const [details, setDetails] = useState<TxDetails | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format transaction hash for display
  const formatTxHash = (hash: string): string => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  // Format status for display
  const formatStatus = (status: TxStatus): string => {
    switch (status) {
      case TxStatus.PENDING:
        return 'Pending';
      case TxStatus.CONFIRMED:
        return 'Confirmed';
      case TxStatus.FAILED:
        return 'Failed';
      case TxStatus.DROPPED:
        return 'Dropped';
      default:
        return 'Unknown';
    }
  };

  // Get status color class
  const getStatusColor = (status: TxStatus): string => {
    switch (status) {
      case TxStatus.PENDING:
        return 'status-pending';
      case TxStatus.CONFIRMED:
        return 'status-confirmed';
      case TxStatus.FAILED:
      case TxStatus.DROPPED:
        return 'status-failed';
      default:
        return 'status-unknown';
    }
  };

  // Start polling for transaction status
  useEffect(() => {
    if (!txHash) {
      setStatus(TxStatus.PENDING);
      setDetails(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setError(null);

    const unsubscribe = transactionService.subscribeToStatus(
      txHash,
      (newStatus, newDetails) => {
        setStatus(newStatus);
        setDetails(newDetails || null);
        
        if (newStatus === TxStatus.CONFIRMED || newStatus === TxStatus.FAILED) {
          setIsPolling(false);
        }

        if (onStatusChange) {
          onStatusChange(newStatus, newDetails);
        }
      }
    );

    return () => {
      unsubscribe();
      setIsPolling(false);
    };
  }, [txHash, transactionService, onStatusChange]);

  // Handle retry action
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Handle view on explorer
  const handleViewOnExplorer = () => {
    if (txHash) {
      const explorerUrl = `https://explorer.stacks.co/txid/${txHash}?chain=testnet`;
      window.open(explorerUrl, '_blank');
    }
  };

  if (!txHash) {
    return null;
  }

  return (
    <div className={`transaction-status ${className}`}>
      <div className="status-header">
        <h3>Transaction Status</h3>
        {isPolling && (
          <span className="polling-indicator">
            <span className="loading-spinner">⟳</span>
            Updating...
          </span>
        )}
      </div>

      <div className="status-content">
        <div className="status-row">
          <span className="label">Transaction Hash:</span>
          <span className="value hash">
            {formatTxHash(txHash)}
            <button
              onClick={handleViewOnExplorer}
              className="explorer-button"
              title="View on Stacks Explorer"
            >
              🔗
            </button>
          </span>
        </div>

        <div className="status-row">
          <span className="label">Status:</span>
          <span className={`value status ${getStatusColor(status)}`}>
            {formatStatus(status)}
            {status === TxStatus.PENDING && (
              <span className="pending-spinner">⟳</span>
            )}
          </span>
        </div>

        {details && (
          <>
            {details.recipient && (
              <div className="status-row">
                <span className="label">Recipient:</span>
                <span className="value address">
                  {formatTxHash(details.recipient)}
                </span>
              </div>
            )}

            {details.amount > 0 && (
              <div className="status-row">
                <span className="label">Amount:</span>
                <span className="value amount">
                  {tokenService.formatAmount(details.amount)} BITDAP
                </span>
              </div>
            )}

            {details.fee > 0 && (
              <div className="status-row">
                <span className="label">Fee:</span>
                <span className="value fee">
                  {details.fee.toString()} µSTX
                </span>
              </div>
            )}

            {details.blockHeight && (
              <div className="status-row">
                <span className="label">Block Height:</span>
                <span className="value block">
                  {details.blockHeight}
                </span>
              </div>
            )}

            {details.timestamp && (
              <div className="status-row">
                <span className="label">Timestamp:</span>
                <span className="value timestamp">
                  {new Date(details.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {status === TxStatus.CONFIRMED && (
          <div className="success-message">
            ✅ Transaction confirmed successfully!
          </div>
        )}

        {status === TxStatus.FAILED && (
          <div className="error-section">
            <div className="error-message">
              ❌ Transaction failed. Please try again.
            </div>
            {onRetry && (
              <button
                onClick={handleRetry}
                className="retry-button"
              >
                Retry Transfer
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};