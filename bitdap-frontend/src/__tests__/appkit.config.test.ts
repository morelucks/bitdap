/**
 * AppKit Configuration Tests
 * Tests for AppKit configuration validation and setup
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { appKitConfig } from '@config/appkit.config';

describe('AppKit Configuration', () => {
  it('should have a valid project ID', () => {
    expect(appKitConfig.projectId).toBeDefined();
  });

  it('should have metadata configured', () => {
    expect(appKitConfig.metadata).toBeDefined();
    expect(appKitConfig.metadata.name).toBeDefined();
    expect(appKitConfig.metadata.description).toBeDefined();
    expect(appKitConfig.metadata.url).toBeDefined();
    expect(appKitConfig.metadata.icons).toBeDefined();
    expect(appKitConfig.metadata.icons.length).toBeGreaterThan(0);
  });

  it('should have both mainnet and testnet chains configured', () => {
    expect(appKitConfig.chains).toBeDefined();
    expect(appKitConfig.chains.length).toBeGreaterThanOrEqual(2);

    const chainIds = appKitConfig.chains.map((c) => c.chainId);
    expect(chainIds).toContain(1); // mainnet
    expect(chainIds).toContain(2147483648); // testnet
  });

  it('should have valid chain configurations', () => {
    appKitConfig.chains.forEach((chain) => {
      expect(chain.chainId).toBeDefined();
      expect(chain.name).toBeDefined();
      expect(chain.currency).toBe('STX');
      expect(chain.explorerUrl).toBeDefined();
      expect(chain.rpcUrl).toBeDefined();
    });
  });
});
