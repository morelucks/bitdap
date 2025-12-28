/**
 * Environment Validator Tests
 * Tests for environment variable validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateAppKitConfig } from '@utils/env-validator';

describe('Environment Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate when all required variables are set', () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_APP_NAME = 'Bitdap';
    process.env.NEXT_PUBLIC_STACKS_NETWORK = 'testnet';

    const result = validateAppKitConfig();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when Project ID is missing', () => {
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    process.env.NEXT_PUBLIC_APP_NAME = 'Bitdap';

    const result = validateAppKitConfig();
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID');
  });

  it('should fail when App Name is missing', () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';
    delete process.env.NEXT_PUBLIC_APP_NAME;

    const result = validateAppKitConfig();
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid network', () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_APP_NAME = 'Bitdap';
    process.env.NEXT_PUBLIC_STACKS_NETWORK = 'invalid-network';

    const result = validateAppKitConfig();
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should accept mainnet as valid network', () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_APP_NAME = 'Bitdap';
    process.env.NEXT_PUBLIC_STACKS_NETWORK = 'mainnet';

    const result = validateAppKitConfig();
    expect(result.isValid).toBe(true);
  });
});
