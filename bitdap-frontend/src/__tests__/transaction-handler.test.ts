/**
 * Transaction Handler Tests
 * Tests for transaction validation and preparation
 */

import { describe, it, expect } from 'vitest';
import {
  validateTransaction,
  prepareTransaction,
  formatTxId,
  generateMockTxId,
} from '@utils/transaction-handler';

describe('Transaction Handler', () => {
  describe('validateTransaction', () => {
    it('should validate correct transaction parameters', () => {
      const params = {
        to: 'ST1234567890ABCDEFGHIJKLMNOPQRST',
        amount: '100',
      };

      const result = validateTransaction(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when recipient is missing', () => {
      const params = {
        to: '',
        amount: '100',
      };

      const result = validateTransaction(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when amount is missing', () => {
      const params = {
        to: 'ST1234567890ABCDEFGHIJKLMNOPQRST',
        amount: '',
      };

      const result = validateTransaction(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when amount is not a positive number', () => {
      const params = {
        to: 'ST1234567890ABCDEFGHIJKLMNOPQRST',
        amount: '-100',
      };

      const result = validateTransaction(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when amount is not a number', () => {
      const params = {
        to: 'ST1234567890ABCDEFGHIJKLMNOPQRST',
        amount: 'invalid',
      };

      const result = validateTransaction(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('prepareTransaction', () => {
    it('should prepare a valid transaction', () => {
      const params = {
        to: 'ST1234567890ABCDEFGHIJKLMNOPQRST',
        amount: '100',
      };

      const prepared = prepareTransaction(params);
      expect(prepared.to).toBe(params.to);
      expect(prepared.amount).toBe(params.amount);
      expect(prepared.functionName).toBe('transfer');
      expect(prepared.timestamp).toBeDefined();
    });

    it('should throw error for invalid transaction', () => {
      const params = {
        to: '',
        amount: '100',
      };

      expect(() => prepareTransaction(params)).toThrow();
    });
  });

  describe('formatTxId', () => {
    it('should return short tx IDs unchanged', () => {
      const txId = '0x1234567890';
      expect(formatTxId(txId)).toBe(txId);
    });

    it('should format long tx IDs', () => {
      const txId = '0x' + 'a'.repeat(64);
      const formatted = formatTxId(txId);
      expect(formatted).toContain('...');
      expect(formatted.length).toBeLessThan(txId.length);
    });
  });

  describe('generateMockTxId', () => {
    it('should generate a valid tx ID', () => {
      const txId = generateMockTxId();
      expect(txId).toMatch(/^0x[a-f0-9]+$/);
      expect(txId.length).toBeGreaterThan(10);
    });

    it('should generate unique tx IDs', () => {
      const txId1 = generateMockTxId();
      const txId2 = generateMockTxId();
      expect(txId1).not.toBe(txId2);
    });
  });
});
