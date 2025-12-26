/**
 * Error Handler
 * Comprehensive error handling and recovery system
 */

import chalk from 'chalk';
import { ErrorResponse } from '../config/types.js';

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Parse and format contract errors
   */
  public parseContractError(error: any): ErrorResponse {
    if (typeof error === 'number') {
      return this.parseErrorCode(error);
    }

    if (error?.error) {
      return this.parseErrorCode(error.error);
    }

    if (error?.message) {
      return this.parseErrorMessage(error.message);
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      category: 'system',
      suggestions: ['Check your network connection and try again'],
      recoverable: true
    };
  }

  /**
   * Parse error codes from contract
   */
  private parseErrorCode(errorCode: number): ErrorResponse {
    const errorMap: Record<number, ErrorResponse> = {
      // Validation Errors (100-199)
      100: {
        code: 'ERR_INVALID_TIER',
        message: 'Invalid tier specified. Must be 1 (Basic), 2 (Pro), or 3 (VIP)',
        category: 'validation',
        suggestions: [
          'Use tier 1 for Basic pass',
          'Use tier 2 for Pro pass', 
          'Use tier 3 for VIP pass'
        ],
        recoverable: true
      },
      101: {
        code: 'ERR_INVALID_TOKEN_ID',
        message: 'Invalid token ID provided',
        category: 'validation',
        suggestions: [
          'Ensure token ID exists and is greater than 0',
          'Check if the token has been minted',
          'Use the query command to verify token existence'
        ],
        recoverable: true
      },
      102: {
        code: 'ERR_INVALID_PRICE',
        message: 'Invalid price specified. Must be greater than 0',
        category: 'validation',
        suggestions: [
          'Set a positive price value in microSTX',
          'Remember: 1 STX = 1,000,000 microSTX'
        ],
        recoverable: true
      },
      110: {
        code: 'ERR_SELF_TRANSFER',
        message: 'Cannot transfer token to yourself',
        category: 'validation',
        suggestions: [
          'Specify a different recipient address',
          'Check that sender and recipient addresses are different'
        ],
        recoverable: true
      },

      // Authorization Errors (200-299)
      200: {
        code: 'ERR_UNAUTHORIZED',
        message: 'Unauthorized access. Caller lacks required permissions',
        category: 'wallet',
        suggestions: [
          'Ensure you have the necessary role or ownership',
          'Check that you are using the correct private key',
          'Verify your wallet address has the required permissions'
        ],
        recoverable: true
      },
      201: {
        code: 'ERR_NOT_OWNER',
        message: 'Not the owner of this token',
        category: 'wallet',
        suggestions: [
          'Only token owners can perform this operation',
          'Use the query command to check token ownership',
          'Ensure you are using the correct private key'
        ],
        recoverable: false
      },
      202: {
        code: 'ERR_NOT_ADMIN',
        message: 'Not authorized as contract administrator',
        category: 'wallet',
        suggestions: [
          'Only contract admins can perform this operation',
          'Contact the contract administrator for assistance'
        ],
        recoverable: false
      },
      206: {
        code: 'ERR_BLACKLISTED',
        message: 'Address is blacklisted and cannot perform operations',
        category: 'wallet',
        suggestions: [
          'Contact the contract administrator',
          'This restriction cannot be bypassed'
        ],
        recoverable: false
      },

      // Business Logic Errors (300-399)
      300: {
        code: 'ERR_NOT_FOUND',
        message: 'Requested resource not found',
        category: 'contract',
        suggestions: [
          'Verify the resource exists and try again',
          'Check token ID or listing ID is correct',
          'Use query commands to verify existence'
        ],
        recoverable: true
      },
      302: {
        code: 'ERR_LISTING_NOT_FOUND',
        message: 'Marketplace listing not found',
        category: 'contract',
        suggestions: [
          'Check that the listing ID is correct',
          'Listing may have been cancelled or completed',
          'Use marketplace query to verify active listings'
        ],
        recoverable: true
      },
      307: {
        code: 'ERR_INSUFFICIENT_BALANCE',
        message: 'Insufficient balance for this operation',
        category: 'contract',
        suggestions: [
          'Ensure you have enough STX for the transaction',
          'Check your wallet balance',
          'Consider reducing the transaction amount'
        ],
        recoverable: true
      },

      // Resource Errors (400-499)
      400: {
        code: 'ERR_MAX_SUPPLY',
        message: 'Maximum supply limit reached',
        category: 'contract',
        suggestions: [
          'No more tokens can be minted',
          'Maximum supply of 10,000 tokens has been reached'
        ],
        recoverable: false
      },
      401: {
        code: 'ERR_MAX_TIER_SUPPLY',
        message: 'Maximum tier supply limit reached',
        category: 'contract',
        suggestions: [
          'This tier has reached its maximum supply',
          'Try minting a different tier',
          'Basic: 7,000 max, Pro: 2,500 max, VIP: 500 max'
        ],
        recoverable: false
      },

      // System Errors (500-599)
      500: {
        code: 'ERR_PAUSED',
        message: 'Contract is currently paused',
        category: 'system',
        suggestions: [
          'Wait for contract to be unpaused by administrator',
          'Check contract status using query command',
          'Monitor for announcements about contract resumption'
        ],
        recoverable: true
      },
      501: {
        code: 'ERR_MARKETPLACE_PAUSED',
        message: 'Marketplace operations are currently paused',
        category: 'system',
        suggestions: [
          'Marketplace is temporarily disabled',
          'Basic token operations may still be available',
          'Wait for marketplace to be re-enabled'
        ],
        recoverable: true
      },
      502: {
        code: 'ERR_FEATURE_DISABLED',
        message: 'This feature is currently disabled',
        category: 'system',
        suggestions: [
          'Feature may be temporarily disabled for maintenance',
          'Check for alternative methods to achieve your goal',
          'Contact support for more information'
        ],
        recoverable: true
      }
    };

    return errorMap[errorCode] || {
      code: `ERR_${errorCode}`,
      message: `Transaction failed with error code: ${errorCode}`,
      category: 'contract',
      suggestions: ['Check the transaction parameters and try again'],
      recoverable: true
    };
  }

  /**
   * Parse error messages
   */
  private parseErrorMessage(message: string): ErrorResponse {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error',
        category: 'network',
        suggestions: [
          'Check your internet connection',
          'Verify the node URL is correct',
          'Try again in a few moments'
        ],
        recoverable: true
      };
    }

    if (lowerMessage.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out',
        category: 'network',
        suggestions: [
          'The network may be congested',
          'Try again with a higher fee',
          'Wait a few minutes and retry'
        ],
        recoverable: true
      };
    }

    if (lowerMessage.includes('private key') || lowerMessage.includes('key')) {
      return {
        code: 'WALLET_ERROR',
        message: 'Invalid private key or wallet error',
        category: 'wallet',
        suggestions: [
          'Check that your private key is correct',
          'Ensure the key is in the correct format',
          'Verify the key matches the expected address'
        ],
        recoverable: true
      };
    }

    if (lowerMessage.includes('insufficient funds') || lowerMessage.includes('balance')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds for transaction',
        category: 'wallet',
        suggestions: [
          'Ensure you have enough STX for the transaction',
          'Account for transaction fees',
          'Check your wallet balance'
        ],
        recoverable: true
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: message,
      category: 'system',
      suggestions: ['Check the error details and try again'],
      recoverable: true
    };
  }

  /**
   * Display formatted error
   */
  public displayError(error: ErrorResponse, colors: boolean = true): void {
    const colorize = colors ? chalk : { red: (s: string) => s, yellow: (s: string) => s, blue: (s: string) => s };

    console.log(colorize.red('❌ Error:'), error.message);
    console.log(colorize.blue('Code:'), error.code);
    console.log(colorize.blue('Category:'), error.category);
    
    if (error.suggestions && error.suggestions.length > 0) {
      console.log(colorize.yellow('💡 Suggestions:'));
      error.suggestions.forEach(suggestion => {
        console.log(colorize.yellow(`  • ${suggestion}`));
      });
    }

    if (!error.recoverable) {
      console.log(colorize.red('⚠️  This error cannot be automatically recovered from.'));
    }
  }

  /**
   * Get recovery suggestions
   */
  public getRecoverySuggestions(error: ErrorResponse): string[] {
    const suggestions = [...(error.suggestions || [])];

    if (error.recoverable) {
      suggestions.push('You can retry this operation after addressing the issue');
    }

    if (error.category === 'network') {
      suggestions.push('Check network status and node availability');
    }

    if (error.category === 'validation') {
      suggestions.push('Review the command parameters and correct any issues');
    }

    return suggestions;
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(error: ErrorResponse): boolean {
    const retryableCategories = ['network', 'system'];
    const retryableCodes = ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'ERR_PAUSED'];
    
    return error.recoverable && 
           (retryableCategories.includes(error.category) || 
            retryableCodes.includes(error.code));
  }

  /**
   * Get retry delay based on error type
   */
  public getRetryDelay(error: ErrorResponse, attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    
    let delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
    
    if (error.category === 'network') {
      delay *= 2; // Longer delays for network errors
    }
    
    return Math.min(delay, maxDelay);
  }

  /**
   * Handle unhandled promise rejections
   */
  public setupGlobalErrorHandlers(): void {
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error(chalk.red('❌ Unhandled Promise Rejection:'));
      console.error(reason);
      
      const error = this.parseContractError(reason);
      this.displayError(error);
      
      process.exit(1);
    });

    process.on('uncaughtException', (error: Error) => {
      console.error(chalk.red('❌ Uncaught Exception:'));
      console.error(error);
      
      const parsedError = this.parseContractError(error);
      this.displayError(parsedError);
      
      process.exit(1);
    });
  }

  /**
   * Wrap async functions with error handling
   */
  public async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: ErrorResponse | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = this.parseContractError(error);
        
        if (attempt === maxRetries || !this.isRetryable(lastError)) {
          throw lastError;
        }
        
        const delay = this.getRetryDelay(lastError, attempt);
        console.log(chalk.yellow(`⏳ Retrying ${context} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`));
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}