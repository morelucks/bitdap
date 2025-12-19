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

describe('Token Transfer Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockTokenService.getBalance.mockResolvedValue(BigInt(1000000)); // 1 BITDAP
    mockTokenService.validateAddress.mockReturnValue(true);
    mockTokenService.validateAmount.mockReturnValue(true);
    mockTokenService.parseAmount.mockImplementation((amount: string) => BigInt(Math.floor(parseFloat(amount) * 1000000)));
    mockTokenService.formatAmount.mockImplementation((amount: bigint) => (Number(amount) / 1000000).toFixed(6));
    mockTokenService.transfer.mockResolvedValue('0x1234567890abcdef');
    
    mockTransactionService.getTransactionStatus.mockResolvedValue(TxStatus.PENDING);
    mockTransactionService.subscribeToStatus.mockImplementation((txHash, callback) => {
      // Simulate status updates
      setTimeout(() => callback(TxStatus.CONFIRMED), 100);
    });
  });

  it('should complete full transfer workflow from form to confirmation', async () => {
    render(<App />);

    // Wait for app to initialize and balance to load
    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Fill in transfer form
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    // Submit transfer
    const sendButton = screen.getByText('Send Transfer');
    expect(sendButton).not.toBeDisabled();
    
    fireEvent.click(sendButton);

    // Verify transfer was called with correct parameters
    await waitFor(() => {
      expect(mockTokenService.transfer).toHaveBeenCalledWith(
        expect.any(String), // private key
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        BigInt(500000) // 0.5 BITDAP in micro units
      );
    });

    // Verify transaction status is displayed
    await waitFor(() => {
      expect(screen.getByText('Transaction Status')).toBeInTheDocument();
      expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    });

    // Wait for status to update to confirmed
    await waitFor(() => {
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify success notification appears
    await waitFor(() => {
      expect(screen.getByText(/Transaction confirmed successfully/)).toBeInTheDocument();
    });

    // Verify form is cleared after successful transfer
    expect(recipientInput).toHaveValue('');
    expect(amountInput).toHaveValue('');
  });

  it('should handle validation errors properly', async () => {
    mockTokenService.validateAddress.mockReturnValue(false);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Enter invalid address
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    fireEvent.change(recipientInput, { target: { value: 'invalid-address' } });
    fireEvent.blur(recipientInput);

    // Verify validation error is shown
    await waitFor(() => {
      expect(screen.getByText('Invalid Stacks address format')).toBeInTheDocument();
    });

    // Verify send button is disabled
    const sendButton = screen.getByText('Send Transfer');
    expect(sendButton).toBeDisabled();
  });

  it('should handle insufficient balance error', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Enter amount greater than balance
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '2.0' } }); // More than 1 BITDAP balance

    // Verify insufficient balance error
    await waitFor(() => {
      expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
    });

    // Verify send button is disabled
    const sendButton = screen.getByText('Send Transfer');
    expect(sendButton).toBeDisabled();
  });

  it('should handle self-transfer prevention', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Enter own address as recipient
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    fireEvent.change(recipientInput, { 
      target: { value: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' } // Demo user address
    });

    // Verify self-transfer error
    await waitFor(() => {
      expect(screen.getByText('Cannot transfer to your own address')).toBeInTheDocument();
    });

    // Verify send button is disabled
    const sendButton = screen.getByText('Send Transfer');
    expect(sendButton).toBeDisabled();
  });

  it('should handle transaction failure and allow retry', async () => {
    mockTokenService.transfer.mockRejectedValue(new Error('Network error'));
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Fill form and submit
    const recipientInput = screen.getByPlaceholderText(/Enter Stacks address/);
    const amountInput = screen.getByPlaceholderText('0.000000');
    
    fireEvent.change(recipientInput, { 
      target: { value: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' } 
    });
    fireEvent.change(amountInput, { target: { value: '0.5' } });

    const sendButton = screen.getByText('Send Transfer');
    fireEvent.click(sendButton);

    // Verify error notification appears
    await waitFor(() => {
      expect(screen.getByText(/Transfer failed: Network error/)).toBeInTheDocument();
    });

    // Verify form is still populated for retry
    expect(recipientInput).toHaveValue('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(amountInput).toHaveValue('0.5');
  });

  it('should use MAX button to set full balance', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Click MAX button
    const maxButton = screen.getByText('MAX');
    fireEvent.click(maxButton);

    // Verify amount is set to full balance
    const amountInput = screen.getByPlaceholderText('0.000000');
    expect(amountInput).toHaveValue('1.000000');
  });

  it('should clear form when Clear button is clicked', async () => {
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

    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Verify form is cleared
    expect(recipientInput).toHaveValue('');
    expect(amountInput).toHaveValue('');
  });

  it('should refresh balance after successful transaction', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1.000000 BITDAP')).toBeInTheDocument();
    });

    // Complete a transfer
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

    // Verify balance was fetched again (called at least twice: initial + refresh)
    await waitFor(() => {
      expect(mockTokenService.getBalance).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle transaction status polling correctly', async () => {
    // Mock status progression: pending -> confirmed
    let statusCallCount = 0;
    mockTransactionService.getTransactionStatus.mockImplementation(() => {
      statusCallCount++;
      return Promise.resolve(statusCallCount === 1 ? TxStatus.PENDING : TxStatus.CONFIRMED);
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

    // Verify transaction status component appears
    await waitFor(() => {
      expect(screen.getByText('Transaction Status')).toBeInTheDocument();
    });

    // Verify status updates from pending to confirmed
    await waitFor(() => {
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});