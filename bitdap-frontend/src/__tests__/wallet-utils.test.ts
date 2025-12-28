/**
 * Wallet Utilities Tests
 * Tests for wallet helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  isValidStacksAddress,
  getNetworkFromAddress,
  isContractAddress,
} from '@utils/wallet-utils';

describe('Wallet Utilities', () => {
  describe('formatAddress', () => {
    it('should format long addresses', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST';
      const formatted = formatAddress(address);
      expect(formatted).toContain('...');
      expect(formatted).toMatch(/^ST12\.\.\.QRST$/);
    });

    it('should return short addresses unchanged', () => {
      const address = 'ST12';
      const formatted = formatAddress(address);
      expect(formatted).toBe(address);
    });

    it('should support custom character count', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST';
      const formatted = formatAddress(address, 6);
      expect(formatted).toMatch(/^ST1234\.\.\.PQRST$/);
    });
  });

  describe('isValidStacksAddress', () => {
    it('should validate testnet addresses', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST';
      expect(isValidStacksAddress(address)).toBe(true);
    });

    it('should validate mainnet addresses starting with S', () => {
      const address = 'S1234567890ABCDEFGHIJKLMNOPQRST';
      expect(isValidStacksAddress(address)).toBe(true);
    });

    it('should validate mainnet addresses starting with SP', () => {
      const address = 'SP1234567890ABCDEFGHIJKLMNOPQRST';
      expect(isValidStacksAddress(address)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidStacksAddress('invalid')).toBe(false);
      expect(isValidStacksAddress('0x1234')).toBe(false);
      expect(isValidStacksAddress('')).toBe(false);
    });
  });

  describe('getNetworkFromAddress', () => {
    it('should identify testnet addresses', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST';
      expect(getNetworkFromAddress(address)).toBe('testnet');
    });

    it('should identify mainnet addresses', () => {
      const address = 'S1234567890ABCDEFGHIJKLMNOPQRST';
      expect(getNetworkFromAddress(address)).toBe('mainnet');
    });

    it('should identify SP mainnet addresses', () => {
      const address = 'SP1234567890ABCDEFGHIJKLMNOPQRST';
      expect(getNetworkFromAddress(address)).toBe('mainnet');
    });

    it('should return null for invalid addresses', () => {
      expect(getNetworkFromAddress('invalid')).toBeNull();
      expect(getNetworkFromAddress('0x1234')).toBeNull();
    });
  });

  describe('isContractAddress', () => {
    it('should identify contract addresses', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST.contract-name';
      expect(isContractAddress(address)).toBe(true);
    });

    it('should identify regular addresses as non-contracts', () => {
      const address = 'ST1234567890ABCDEFGHIJKLMNOPQRST';
      expect(isContractAddress(address)).toBe(false);
    });
  });
});
