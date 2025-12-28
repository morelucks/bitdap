/**
 * Storage Manager
 * Manages persistent storage for AppKit connection state
 */

export interface StoredConnectionState {
  account: string;
  network: string;
  provider: string;
  timestamp: number;
}

const STORAGE_KEY = 'appkit_connection_state';
const STORAGE_VERSION = 1;

/**
 * Saves connection state to localStorage
 */
export function saveConnectionState(state: Omit<StoredConnectionState, 'timestamp'>): void {
  try {
    const storageData: StoredConnectionState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save connection state:', error);
  }
}

/**
 * Retrieves connection state from localStorage
 */
export function getConnectionState(): StoredConnectionState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const state: StoredConnectionState = JSON.parse(data);

    // Check if state is older than 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > sevenDaysMs) {
      clearConnectionState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to retrieve connection state:', error);
    return null;
  }
}

/**
 * Clears connection state from localStorage
 */
export function clearConnectionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear connection state:', error);
  }
}

/**
 * Saves transaction history
 */
export function saveTransactionHistory(txId: string, txData: any): void {
  try {
    const historyKey = `appkit_tx_${txId}`;
    localStorage.setItem(historyKey, JSON.stringify(txData));
  } catch (error) {
    console.error('Failed to save transaction history:', error);
  }
}

/**
 * Retrieves transaction history
 */
export function getTransactionHistory(txId: string): any | null {
  try {
    const historyKey = `appkit_tx_${txId}`;
    const data = localStorage.getItem(historyKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve transaction history:', error);
    return null;
  }
}

/**
 * Gets all transaction IDs from history
 */
export function getAllTransactionIds(): string[] {
  try {
    const txIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('appkit_tx_')) {
        txIds.push(key.replace('appkit_tx_', ''));
      }
    }
    return txIds;
  } catch (error) {
    console.error('Failed to get transaction IDs:', error);
    return [];
  }
}

/**
 * Clears all transaction history
 */
export function clearTransactionHistory(): void {
  try {
    const txIds = getAllTransactionIds();
    txIds.forEach((txId) => {
      localStorage.removeItem(`appkit_tx_${txId}`);
    });
  } catch (error) {
    console.error('Failed to clear transaction history:', error);
  }
}
