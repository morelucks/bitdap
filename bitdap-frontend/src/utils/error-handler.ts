// Error handling utilities for WalletConnect

export class WalletConnectError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WalletConnectError';
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  CONNECTION_TIMEOUT: 'Wallet connection timed out. Please try again.',
  INVALID_PROJECT_ID: 'Invalid WalletConnect Project ID. Check your environment variables.',
  NETWORK_MISMATCH: 'Wallet is on a different network. Please switch networks in your wallet.',
  SESSION_REJECTED: 'Connection was rejected. Please try again.',
  STORAGE_ERROR: 'Unable to save session. Some features may not persist.',
  SIGNING_FAILED: 'Transaction signing failed. Please try again.',
  BROADCAST_FAILED: 'Failed to broadcast transaction. Please check your connection.',
  INVALID_TRANSACTION: 'Invalid transaction format.',
  SESSION_EXPIRED: 'Session has expired. Please reconnect.',
  WALLET_NOT_CONNECTED: 'No wallet is currently connected.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function createError(
  code: string,
  details?: Record<string, unknown>
): WalletConnectError {
  const message = getErrorMessage(code);
  return new WalletConnectError(code, message, details);
}

export function handleError(error: unknown): WalletConnectError {
  if (error instanceof WalletConnectError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to determine error type from message
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {
      return createError('CONNECTION_TIMEOUT', { originalError: error.message });
    }
    if (message.includes('rejected')) {
      return createError('SESSION_REJECTED', { originalError: error.message });
    }
    if (message.includes('network')) {
      return createError('NETWORK_MISMATCH', { originalError: error.message });
    }
    
    return createError('UNKNOWN_ERROR', { originalError: error.message });
  }

  return createError('UNKNOWN_ERROR', { originalError: String(error) });
}

export function logError(error: WalletConnectError): void {
  console.error(`[WalletConnect Error] ${error.code}: ${error.message}`, error.details);
}
