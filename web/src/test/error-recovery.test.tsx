import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { TokenService } from '../services/TokenService';
import { TransactionService } from '../services/TransactionService';
import { TxStatus } from '../types';

// Mock services
vi.mock('../services/TokenService');
vi.mock('../services/TransactionService');

const mockTokenService = {
  getBalance: vi.fn(),
  transfer: vi.fn(),
  validateAddress: vi.fn(),
  validateAmount: vi.fn(),
  parseAmount: vi.fn(),
  formatAmount: vi.fn(),
};

const mockTransactionService = {
  getTransactionStatus: vi.fn(),
  waitForConfirmation: vi.fn(),
  subscribeToStatus: vi.fn(),
};

// Mock the service constructors
vi.mocked(TokenService).mockImplementation(() => mockTokenService as any);
vi.mocked(TransactionService).mockImplementation(() => mockTransactionService as any);

describe('Error Recovery Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockTokenService.getBalance.mockResolvedValue(BigInt(1000000));
    mockTokenService.validateAddress.mockReturnValue(true);
    mockTokenService.validateAmount.mockReturnValue(true);
    mockTokenService.parseAmount.mockImplementation((amount: string) => BigInt(Math.floor(parseFloat(amount) * 1000000)));
    mockTokenService.formatAmount.mockImplementation((amount: bigint) => (Number(amount) / 1000000).toFixed(6));
  });

  it('should handle network errors during balance fetch', async () => {
    mockTokenService.getBalance.mockRejectedValue(new Error('Network connection failed'));
    
    render(<App />);

    // Verify error notification appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch balance/)).toBeInTheDocument();
    });

    // Verify app still renders but with error state
    expect(screen.getByText('Bitdap Token Transfer')).toBeInTheDocument();
  });

  it('should handle transaction broadcast failures with specific error messages', async () => {
    mockTokenService.transfer.mockRejectedValue(new Error('Insufficient fees'));
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Submit transfer
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Verify specific error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Transfer failed: Insufficient fees/)).toBeInTheDocument();
    });

    // Verify form remains populated for retry
    expect(recipientInput).toHaveValue('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(amountInput).toHaveValue('0.5');
  });

  it('should handle transaction status polling failures', async () => {
    mockTokenService.transfer.mockResolvedValue('0x1234567890abcdef');
    mockTransactionService.getTransactionStatus.mockRejectedValue(new Error('API unavailable'));
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Submit transfer
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Verify transaction hash is still displayed even if status polling fails
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    });
  });

  it('should handle failed transactions and allow retry', async () => {
    mockTokenService.transfer.mockResolvedValue('0x1234567890abcdef');
    mockTransactionService.subscribeToStatus.mockImplementation((txHash, callback) => {
      setTimeout(() => callback(TxStatus.FAILED), 100);
    });
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Submit transfer
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Wait for transaction to fail
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify error notification appears
    await waitFor(() => {
      expect(screen.getByText(/Transaction failed/)).toBeInTheDocument();
    });

    // Verify retry button or form is available for retry
    expect(screen.getByText('Send Transfer')).toBeInTheDocument();
  });

  it('should handle balance refresh failures gracefully', async () => {
    // Initial balance fetch succeeds
    mockTokenService.getBalance.mockResolvedValueOnce(BigInt(1000000));
    // Subsequent refresh fails
    mockTokenService.getBalance.mockRejectedValue(new Error('Network timeout'));
    
    mockTokenService.transfer.mockResolvedValue('0x1234567890abcdef');
    mockTransactionService.subscribeToStatus.mockImplementation((txHash, callback) => {
      setTimeout(() => callback(TxStatus.CONFIRMED), 100);
    });
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Submit transfer
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Wait for transaction to be confirmed
    await waitFor(() => {
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify app continues to function despite balance refresh failure
    expect(screen.getByText('Bitdap Token Transfer')).toBeInTheDocument();
  });

  it('should handle contract errors with user-friendly messages', async () => {
    const contractError = new Error('(err u1) - Insufficient balance');
    mockTokenService.transfer.mockRejectedValue(contractError);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Submit transfer
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Verify contract error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Transfer failed.*Insufficient balance/)).toBeInTheDocument();
    });
  });

  it('should handle multiple rapid form submissions gracefully', async () => {
    mockTokenService.transfer.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('0x1234567890abcdef'), 1000))
    );
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Fill form
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    
    // Click multiple times rapidly
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    // Verify only one transfer is initiated
    await waitFor(() => {
      expect(mockTokenService.transfer).toHaveBeenCalledTimes(1);
    });

    // Verify button is disabled during loading
    expect(sendButton).toBeDisabled();
  });

  it('should handle application initialization failures', async () => {
    mockTokenService.getBalance.mockRejectedValue(new Error('Failed to initialize application'));
    
    render(<App />);

    // Verify initialization error is handled
    await waitFor(() => {
      expect(screen.getByText(/Failed to initialize application/)).toBeInTheDocument();
    });
  });
});