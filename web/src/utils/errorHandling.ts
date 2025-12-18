// Error types for different categories
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  TRANSACTION = 'transaction',
  BLOCKCHAIN = 'blockchain',
  UNKNOWN = 'unknown',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  code?: string | number;
  retryable?: boolean;
}

// Create typed errors for different scenarios
export class ValidationError extends Error {
  type = ErrorType.VALIDATION;
  retryable = false;

  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  type = ErrorType.NETWORK;
  retryable = true;

  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TransactionError extends Error {
  type = ErrorType.TRANSACTION;
  retryable = false;

  constructor(message: string, public txHash?: string, public code?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class BlockchainError extends Error {
  type = ErrorType.BLOCKCHAIN;
  retryable = false;

  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'BlockchainError';
  }
}

// Error message mapping for user-friendly display
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    if (error.code === 404) {
      return 'Service not found. Please check your network connection.';
    }
    if (error.code === 500) {
      return 'Server error. Please try again later.';
    }
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof TransactionError) {
    return `Transaction failed: ${error.message}`;
  }

  if (error instanceof BlockchainError) {
    return `Blockchain error: ${error.message}`;
  }

  if (error instanceof Error) {
    // Handle specific Stacks.js errors
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for this transaction.';
    }
    if (error.message.includes('nonce')) {
      return 'Transaction nonce error. Please try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Transaction timed out. Please check the status and try again.';
    }
    if (error.message.includes('network')) {
      return 'Network connection error. Please check your connection.';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Check if error is retryable
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch')
    );
  }

  return false;
};

// Parse Stacks API errors
export const parseStacksError = (error: any): AppError => {
  if (error?.reason) {
    // Stacks transaction broadcast error
    return {
      type: ErrorType.TRANSACTION,
      message: error.reason,
      code: error.error,
      retryable: false,
    };
  }

  if (error?.message) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('insufficient')) {
      return {
        type: ErrorType.VALIDATION,
        message: 'Insufficient balance for this transaction',
        retryable: false,
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection error',
        retryable: true,
      };
    }

    if (message.includes('invalid') && message.includes('address')) {
      return {
        type: ErrorType.VALIDATION,
        message: 'Invalid recipient address',
        retryable: false,
      };
    }
  }

  return {
    type: ErrorType.UNKNOWN,
    message: getErrorMessage(error),
    originalError: error instanceof Error ? error : undefined,
    retryable: isRetryableError(error),
  };
};

// Retry logic with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Error logging utility
export const logError = (error: unknown, context?: string) => {
  const errorInfo = {
    message: getErrorMessage(error),
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  };

  console.error('Application Error:', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo });
};