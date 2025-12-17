import { StacksNetwork } from '@stacks/network';
import { TxStatus, TxResult, TxDetails } from '../types';

export interface TransactionServiceConfig {
  network: StacksNetwork;
  apiUrl?: string;
}

export class TransactionService {
  private network: StacksNetwork;
  private apiUrl: string;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TransactionServiceConfig) {
    this.network = config.network;
    this.apiUrl = config.apiUrl || this.network.coreApiUrl;
  }

  /**
   * Get current transaction status
   */
  async getTransactionStatus(txHash: string): Promise<TxStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txHash}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return TxStatus.PENDING;
        }
        throw new Error(`Failed to fetch transaction status: ${response.statusText}`);
      }

      const txData = await response.json();
      
      switch (txData.tx_status) {
        case 'success':
          return TxStatus.CONFIRMED;
        case 'abort_by_response':
        case 'abort_by_post_condition':
          return TxStatus.FAILED;
        case 'pending':
        default:
          return TxStatus.PENDING;
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      return TxStatus.PENDING;
    }
  }

  /**
   * Get detailed transaction information
   */
  async getTransactionDetails(txHash: string): Promise<TxDetails | null> {
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txHash}`);
      
      if (!response.ok) {
        return null;
      }

      const txData = await response.json();
      
      // Extract transfer details from contract call
      let recipient = '';
      let amount = BigInt(0);
      
      if (txData.contract_call && txData.contract_call.function_args) {
        const args = txData.contract_call.function_args;
        if (args.length >= 3) {
          // args[0] = amount, args[1] = sender, args[2] = recipient
          amount = BigInt(args[0].repr.replace('u', ''));
          recipient = args[2].repr.replace(/['"]/g, '');
        }
      }

      return {
        hash: txHash,
        recipient,
        amount,
        fee: BigInt(txData.fee_rate || 0),
        blockHeight: txData.block_height,
        timestamp: txData.burn_block_time_iso ? new Date(txData.burn_block_time_iso).getTime() : undefined,
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  /**
   * Wait for transaction confirmation with timeout
   */
  async waitForConfirmation(
    txHash: string,
    timeoutMs: number = 300000 // 5 minutes default
  ): Promise<TxResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkStatus = async () => {
        try {
          const status = await this.getTransactionStatus(txHash);
          
          if (status === TxStatus.CONFIRMED) {
            const details = await this.getTransactionDetails(txHash);
            resolve({
              success: true,
              txHash,
              details: details || {
                hash: txHash,
                recipient: '',
                amount: BigInt(0),
                fee: BigInt(0),
              },
            });
            return;
          }
          
          if (status === TxStatus.FAILED) {
            resolve({
              success: false,
              txHash,
              details: {
                hash: txHash,
                recipient: '',
                amount: BigInt(0),
                fee: BigInt(0),
              },
              error: 'Transaction failed',
            });
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            resolve({
              success: false,
              txHash,
              details: {
                hash: txHash,
                recipient: '',
                amount: BigInt(0),
                fee: BigInt(0),
              },
              error: 'Transaction timeout',
            });
            return;
          }
          
          // Continue polling
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  }

  /**
   * Subscribe to transaction status changes
   */
  subscribeToStatus(
    txHash: string,
    callback: (status: TxStatus, details?: TxDetails) => void,
    intervalMs: number = 5000
  ): () => void {
    // Clear existing interval if any
    this.unsubscribeFromStatus(txHash);
    
    let lastStatus: TxStatus | null = null;
    
    const checkStatus = async () => {
      try {
        const status = await this.getTransactionStatus(txHash);
        
        if (status !== lastStatus) {
          lastStatus = status;
          const details = await this.getTransactionDetails(txHash);
          callback(status, details || undefined);
        }
        
        // Stop polling if transaction is final
        if (status === TxStatus.CONFIRMED || status === TxStatus.FAILED) {
          this.unsubscribeFromStatus(txHash);
        }
      } catch (error) {
        console.error('Error in status subscription:', error);
      }
    };
    
    // Initial check
    checkStatus();
    
    // Set up polling
    const interval = setInterval(checkStatus, intervalMs);
    this.pollingIntervals.set(txHash, interval);
    
    // Return unsubscribe function
    return () => this.unsubscribeFromStatus(txHash);
  }

  /**
   * Unsubscribe from transaction status updates
   */
  unsubscribeFromStatus(txHash: string): void {
    const interval = this.pollingIntervals.get(txHash);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(txHash);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }

  /**
   * Check if transaction exists in mempool or on chain
   */
  async transactionExists(txHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txHash}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get estimated transaction fee
   */
  async getEstimatedFee(): Promise<bigint> {
    try {
      const response = await fetch(`${this.apiUrl}/v2/fees/transfer`);
      if (!response.ok) {
        return BigInt(1000); // Default fee
      }
      
      const feeData = await response.json();
      return BigInt(feeData.estimated_cost || 1000);
    } catch (error) {
      console.error('Error fetching estimated fee:', error);
      return BigInt(1000); // Default fee
    }
  }
}