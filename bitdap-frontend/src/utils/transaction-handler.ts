/**
 * Transaction Handler Utilities
 * Handles transaction preparation, validation, and submission
 */

export interface TransactionParams {
  to: string;
  amount: string;
  functionName?: string;
  functionArgs?: any[];
}

export interface TransactionResult {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

/**
 * Validates transaction parameters
 */
export function validateTransaction(params: TransactionParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.to || params.to.trim() === '') {
    errors.push('Recipient address is required');
  }

  if (!params.amount || params.amount.trim() === '') {
    errors.push('Amount is required');
  }

  const amount = parseFloat(params.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prepares a transaction for submission
 */
export function prepareTransaction(params: TransactionParams) {
  const validation = validateTransaction(params);

  if (!validation.valid) {
    throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
  }

  return {
    to: params.to,
    amount: params.amount,
    functionName: params.functionName || 'transfer',
    functionArgs: params.functionArgs || [],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats transaction ID for display
 */
export function formatTxId(txId: string): string {
  if (txId.length <= 16) {
    return txId;
  }
  return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
}

/**
 * Generates a mock transaction ID for testing
 */
export function generateMockTxId(): string {
  return `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
}

/**
 * Monitors transaction status
 */
export async function monitorTransaction(
  txId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<TransactionResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Simulate checking transaction status
      // In real implementation, this would query the blockchain
      const isConfirmed = Math.random() > 0.7;

      if (isConfirmed) {
        return {
          txId,
          status: 'confirmed',
        };
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (error) {
      return {
        txId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return {
    txId,
    status: 'pending',
  };
}
