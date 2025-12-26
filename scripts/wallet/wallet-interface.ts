/**
 * Wallet Interface
 * Handles wallet connections and transaction signing
 */

import { 
  createStacksPrivateKey,
  getAddressFromPrivateKey,
  TransactionVersion,
  privateKeyToString,
  publicKeyToString,
  getPublicKey
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { ConfigManager } from '../config/config-manager.js';

export interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
}

export class WalletInterface {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Validate private key format
   */
  public validatePrivateKey(privateKey: string): boolean {
    try {
      // Remove '0x' prefix if present
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      
      // Check if it's a valid hex string of correct length
      if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        return false;
      }

      // Try to create a Stacks private key
      createStacksPrivateKey(cleanKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet information from private key
   */
  public getWalletInfo(privateKey: string): WalletInfo {
    if (!this.validatePrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const stacksPrivateKey = createStacksPrivateKey(cleanKey);
    const publicKey = getPublicKey(stacksPrivateKey);
    
    const config = this.configManager.getConfig();
    const isMainnet = config.network.type === 'mainnet';
    
    const address = getAddressFromPrivateKey(
      privateKeyToString(stacksPrivateKey),
      isMainnet ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    );

    return {
      address,
      publicKey: publicKeyToString(publicKey),
      network: config.network.type
    };
  }

  /**
   * Validate Stacks address format
   */
  public validateAddress(address: string): boolean {
    // Basic Stacks address validation
    const stacksAddressRegex = /^S[0-9A-Z]{39}$/;
    return stacksAddressRegex.test(address);
  }

  /**
   * Get address from private key
   */
  public getAddressFromPrivateKey(privateKey: string): string {
    const walletInfo = this.getWalletInfo(privateKey);
    return walletInfo.address;
  }

  /**
   * Prepare transaction details for user review
   */
  public prepareTransactionSummary(
    functionName: string,
    parameters: Record<string, any>,
    estimatedFee?: number
  ): string {
    let summary = '\n📋 Transaction Summary:\n';
    summary += `Function: ${functionName}\n`;
    summary += 'Parameters:\n';
    
    Object.entries(parameters).forEach(([key, value]) => {
      summary += `  ${key}: ${value}\n`;
    });
    
    if (estimatedFee) {
      summary += `Estimated Fee: ${estimatedFee} microSTX\n`;
    }
    
    summary += '\n⚠️  Please review the transaction details carefully before proceeding.\n';
    
    return summary;
  }

  /**
   * Check if address matches the private key
   */
  public verifyAddressOwnership(privateKey: string, expectedAddress: string): boolean {
    try {
      const actualAddress = this.getAddressFromPrivateKey(privateKey);
      return actualAddress === expectedAddress;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a new random private key (for testing purposes)
   */
  public generateRandomPrivateKey(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get network-specific transaction version
   */
  public getTransactionVersion(): TransactionVersion {
    const config = this.configManager.getConfig();
    return config.network.type === 'mainnet' 
      ? TransactionVersion.Mainnet 
      : TransactionVersion.Testnet;
  }

  /**
   * Sanitize private key for logging (never log the actual key)
   */
  public sanitizePrivateKeyForLogging(privateKey: string): string {
    if (!privateKey || privateKey.length < 8) {
      return '[INVALID]';
    }
    
    const start = privateKey.slice(0, 4);
    const end = privateKey.slice(-4);
    return `${start}...${end}`;
  }

  /**
   * Check if wallet is connected to the correct network
   */
  public validateNetworkConnection(walletAddress: string): boolean {
    const config = this.configManager.getConfig();
    
    // Mainnet addresses start with 'SP' or 'SM', testnet with 'ST' or 'SN'
    const isMainnetAddress = walletAddress.startsWith('SP') || walletAddress.startsWith('SM');
    const isTestnetAddress = walletAddress.startsWith('ST') || walletAddress.startsWith('SN');
    
    if (config.network.type === 'mainnet' && !isMainnetAddress) {
      return false;
    }
    
    if (config.network.type === 'testnet' && !isTestnetAddress) {
      return false;
    }
    
    return true;
  }

  /**
   * Get wallet connection status
   */
  public getConnectionStatus(privateKey?: string): {
    connected: boolean;
    address?: string;
    network: string;
    networkMatch: boolean;
  } {
    const config = this.configManager.getConfig();
    
    if (!privateKey) {
      return {
        connected: false,
        network: config.network.type,
        networkMatch: false
      };
    }

    try {
      const walletInfo = this.getWalletInfo(privateKey);
      const networkMatch = this.validateNetworkConnection(walletInfo.address);
      
      return {
        connected: true,
        address: walletInfo.address,
        network: config.network.type,
        networkMatch
      };
    } catch (error) {
      return {
        connected: false,
        network: config.network.type,
        networkMatch: false
      };
    }
  }

  /**
   * Display wallet information
   */
  public displayWalletInfo(privateKey: string): void {
    try {
      const walletInfo = this.getWalletInfo(privateKey);
      const status = this.getConnectionStatus(privateKey);
      
      console.log('\n💼 Wallet Information:');
      console.log(`Address: ${walletInfo.address}`);
      console.log(`Network: ${walletInfo.network}`);
      console.log(`Network Match: ${status.networkMatch ? '✅' : '❌'}`);
      
      if (!status.networkMatch) {
        console.log('⚠️  Warning: Wallet network does not match configured network');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to get wallet info:', error.message);
    }
  }
}