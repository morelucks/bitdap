import React, { useState, useEffect, useCallback } from 'react';
import { TokenService } from '../services/TokenService';
import { BalanceState } from '../types';

interface BalanceDisplayProps {
  address: string;
  tokenService: TokenService;
  refreshTrigger?: number;
  className?: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  address,
  tokenService,
  refreshTrigger = 0,
  className = '',
}) => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    current: BigInt(0),
    formatted: '0',
    isLoading: true,
    lastUpdated: new Date(),
  });
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalanceState(prev => ({
        ...prev,
        isLoading: false,
        current: BigInt(0),
        formatted: '0',
      }));
      return;
    }

    setBalanceState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const balance = await tokenService.getBalance(address);
      const formatted = tokenService.formatAmount(balance);
      
      setBalanceState({
        current: balance,
        formatted,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      setBalanceState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [address, tokenService]);

  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshTrigger]);

  const handleRetry = () => {
    fetchBalance();
  };

  if (balanceState.isLoading) {
    return (
      <div className={`balance-display loading ${className}`}>
        <div className="balance-label">Balance:</div>
        <div className="balance-value">
          <span className="loading-spinner">⟳</span>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`balance-display error ${className}`}>
        <div className="balance-label">Balance:</div>
        <div className="balance-value error">
          <span>Error: {error}</span>
          <button 
            onClick={handleRetry}
            className="retry-button"
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`balance-display ${className}`}>
      <div className="balance-label">Balance:</div>
      <div className="balance-value">
        <span className="amount">{balanceState.formatted}</span>
        <span className="symbol">BITDAP</span>
        <button 
          onClick={handleRetry}
          className="refresh-button"
          type="button"
          title="Refresh balance"
        >
          ↻
        </button>
      </div>
      <div className="last-updated">
        Last updated: {balanceState.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};