import React, { useState, useEffect, useCallback } from 'react';
import { StacksTestnet } from '@stacks/network';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BalanceDisplay } from './components/BalanceDisplay';
import { TransferForm } from './components/TransferForm';
import { TransactionStatus } from './components/TransactionStatus';
import { Notification } from './components/Notification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TokenService, createDefaultTokenService } from './services/TokenService';
import { TransactionService } from './services/TransactionService';
import { useNotifications } from './hooks/useNotifications';
import { getErrorMessage, logError, withRetry } from './utils/errorHandling';
import { TxStatus, TxDetails } from './types';
import './App.css';

// Mock user address for demo - in real app this would come from wallet connection
const DEMO_USER_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const DEMO_PRIVATE_KEY = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';

function App() {
  // Services
  const [tokenService] = useState(() => createDefaultTokenService());
  const [transactionService] = useState(() => new TransactionService({
    network: new StacksTestnet(),
  }));

  // State
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState<string | undefined>();
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Notifications
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
  } = useNotifications();

  // Fetch initial balance
  const fetchBalance = useCallback(async () => {
    try {
      const balance = await withRetry(() => tokenService.getBalance(DEMO_USER_ADDRESS));
      setUserBalance(balance);
    } catch (error) {
      logError(error, 'fetchBalance');
      showError('Failed to fetch balance. Please refresh the page.');
    }
  }, [tokenService, showError]);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await fetchBalance();
        setIsInitialized(true);
        showInfo('Connected to Stacks Testnet');
      } catch (error) {
        logError(error, 'initialize');
        showError('Failed to initialize application');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [fetchBalance, showInfo, showError]);

  // Handle transfer submission
  const handleTransfer = async (recipient: string, amount: string) => {
    setIsLoading(true);
    setCurrentTxHash(undefined);

    try {
      showInfo('Creating transaction...');
      
      const parsedAmount = tokenService.parseAmount(amount);
      const txHash = await tokenService.transfer(
        DEMO_PRIVATE_KEY,
        recipient,
        parsedAmount
      );

      setCurrentTxHash(txHash);
      showSuccess(`Transaction submitted! Hash: ${txHash.slice(0, 8)}...`);
      
    } catch (error) {
      logError(error, 'handleTransfer');
      const errorMessage = getErrorMessage(error);
      showError(`Transfer failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transaction status changes
  const handleStatusChange = useCallback((status: TxStatus, details?: TxDetails) => {
    if (status === TxStatus.CONFIRMED) {
      showSuccess('Transaction confirmed successfully!');
      // Refresh balance after successful transaction
      setBalanceRefreshTrigger(prev => prev + 1);
    } else if (status === TxStatus.FAILED) {
      showError('Transaction failed. Please try again.');
    }
  }, [showSuccess, showError]);

  // Handle retry transfer
  const handleRetry = () => {
    setCurrentTxHash(undefined);
  };

  // Handle form reset and balance refresh
  const handleFormReset = useCallback(() => {
    setCurrentTxHash(undefined);
    setBalanceRefreshTrigger(prev => prev + 1);
  }, []);

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" message="Initializing application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>Bitdap Token Transfer</h1>
          <p>Send BITDAP tokens on Stacks Testnet</p>
        </header>

        <main className="app-main">
          <div className="app-content">
            {/* Balance Display */}
            <section className="balance-section">
              <BalanceDisplay
                address={DEMO_USER_ADDRESS}
                tokenService={tokenService}
                refreshTrigger={balanceRefreshTrigger}
                className="main-balance"
              />
            </section>

            {/* Transfer Form */}
            <section className="transfer-section">
              <TransferForm
                tokenService={tokenService}
                userAddress={DEMO_USER_ADDRESS}
                userBalance={userBalance}
                onTransfer={handleTransfer}
                isLoading={isLoading}
                className="main-form"
              />
            </section>

            {/* Transaction Status */}
            {currentTxHash && (
              <section className="status-section">
                <TransactionStatus
                  txHash={currentTxHash}
                  transactionService={transactionService}
                  tokenService={tokenService}
                  onStatusChange={handleStatusChange}
                  onRetry={handleRetry}
                  className="main-status"
                />
              </section>
            )}
          </div>
        </main>

        {/* Notifications */}
        <div className="notifications-container">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              message={notification.message}
              duration={notification.duration}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>

        <footer className="app-footer">
          <p>
            Demo application for Bitdap Token transfers on Stacks Testnet
          </p>
          <p>
            <strong>Demo Address:</strong> {DEMO_USER_ADDRESS}
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;