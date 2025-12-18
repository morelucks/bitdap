import React, { useState, useEffect } from 'react';
import { TokenService } from '../services/TokenService';
import { FormState, FormErrors } from '../types';

interface TransferFormProps {
  tokenService: TokenService;
  userAddress: string;
  userBalance: bigint;
  onTransfer: (recipient: string, amount: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  tokenService,
  userAddress,
  userBalance,
  onTransfer,
  isLoading = false,
  className = '',
}) => {
  const [formState, setFormState] = useState<FormState>({
    recipient: '',
    amount: '',
    isValid: false,
    errors: {},
  });

  // Validate recipient address
  const validateRecipient = (recipient: string): string | undefined => {
    if (!recipient.trim()) {
      return 'Recipient address is required';
    }

    if (!tokenService.validateAddress(recipient)) {
      return 'Invalid Stacks address format';
    }

    if (recipient === userAddress) {
      return 'Cannot transfer to your own address';
    }

    return undefined;
  };

  // Validate transfer amount
  const validateAmount = (amount: string): string | undefined => {
    if (!amount.trim()) {
      return 'Amount is required';
    }

    if (!tokenService.validateAmount(amount)) {
      return 'Amount must be a positive number';
    }

    try {
      const parsedAmount = tokenService.parseAmount(amount);
      if (parsedAmount > userBalance) {
        const formattedBalance = tokenService.formatAmount(userBalance);
        return `Insufficient balance. Available: ${formattedBalance} BITDAP`;
      }
    } catch (error) {
      return 'Invalid amount format';
    }

    return undefined;
  };

  // Validate entire form
  const validateForm = (recipient: string, amount: string): FormErrors => {
    const errors: FormErrors = {};
    
    const recipientError = validateRecipient(recipient);
    if (recipientError) {
      errors.recipient = recipientError;
    }

    const amountError = validateAmount(amount);
    if (amountError) {
      errors.amount = amountError;
    }

    return errors;
  };

  // Update form state and validation
  const updateFormState = (updates: Partial<Pick<FormState, 'recipient' | 'amount'>>) => {
    const newRecipient = updates.recipient ?? formState.recipient;
    const newAmount = updates.amount ?? formState.amount;
    
    const errors = validateForm(newRecipient, newAmount);
    const isValid = Object.keys(errors).length === 0 && newRecipient.trim() !== '' && newAmount.trim() !== '';

    setFormState({
      recipient: newRecipient,
      amount: newAmount,
      errors,
      isValid,
    });
  };

  // Handle recipient input change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormState({ recipient: e.target.value });
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormState({ amount: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.isValid || isLoading) {
      return;
    }

    try {
      await onTransfer(formState.recipient, formState.amount);
      // Clear form after successful transfer
      setFormState({
        recipient: '',
        amount: '',
        isValid: false,
        errors: {},
      });
    } catch (error) {
      // Error handling is done by parent component
      console.error('Transfer failed:', error);
    }
  };

  // Set max amount (use full balance)
  const handleMaxAmount = () => {
    const maxAmount = tokenService.formatAmount(userBalance);
    updateFormState({ amount: maxAmount });
  };

  // Clear form
  const handleClear = () => {
    setFormState({
      recipient: '',
      amount: '',
      isValid: false,
      errors: {},
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`transfer-form ${className}`}>
      <div className="form-header">
        <h2>Transfer BITDAP Tokens</h2>
      </div>

      <div className="form-group">
        <label htmlFor="recipient" className="form-label">
          Recipient Address
        </label>
        <input
          id="recipient"
          type="text"
          value={formState.recipient}
          onChange={handleRecipientChange}
          placeholder="Enter Stacks address (e.g., ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)"
          className={`form-input ${formState.errors.recipient ? 'error' : ''}`}
          disabled={isLoading}
        />
        {formState.errors.recipient && (
          <div className="error-message">{formState.errors.recipient}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="amount" className="form-label">
          Amount
        </label>
        <div className="amount-input-group">
          <input
            id="amount"
            type="number"
            step="0.000001"
            min="0"
            value={formState.amount}
            onChange={handleAmountChange}
            placeholder="0.000000"
            className={`form-input ${formState.errors.amount ? 'error' : ''}`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleMaxAmount}
            className="max-button"
            disabled={isLoading || userBalance === BigInt(0)}
          >
            MAX
          </button>
          <span className="token-symbol">BITDAP</span>
        </div>
        {formState.errors.amount && (
          <div className="error-message">{formState.errors.amount}</div>
        )}
      </div>

      {formState.errors.general && (
        <div className="error-message general-error">
          {formState.errors.general}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={handleClear}
          className="clear-button"
          disabled={isLoading}
        >
          Clear
        </button>
        <button
          type="submit"
          className="submit-button"
          disabled={!formState.isValid || isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner">⟳</span>
              Sending...
            </>
          ) : (
            'Send Transfer'
          )}
        </button>
      </div>
    </form>
  );
};