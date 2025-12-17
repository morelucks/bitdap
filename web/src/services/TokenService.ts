import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  noneCV,
  callReadOnlyFunction,
  cvToValue,
} from '@stacks/transactions';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';

export interface TokenServiceConfig {
  network: StacksNetwork;
  contractAddress: string;
  contractName: string;
}

export class TokenService {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string;

  constructor(config: TokenServiceConfig) {
    this.network = config.network;
    this.contractAddress = config.contractAddress;
    this.contractName = config.contractName;
  }

  /**
   * Get token balance for a given address
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(address)],
        network: this.network,
        senderAddress: address,
      });

      const value = cvToValue(result);
      if (value && typeof value === 'object' && 'value' in value) {
        return BigInt(value.value as string);
      }
      return BigInt(0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Create and broadcast a transfer transaction
   */
  async transfer(
    senderKey: string,
    recipient: string,
    amount: bigint,
    memo?: string
  ): Promise<string> {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'transfer',
        functionArgs: [
          uintCV(amount),
          standardPrincipalCV(senderKey), // sender
          standardPrincipalCV(recipient),
          memo ? noneCV() : noneCV(), // memo is optional
        ],
        senderKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      if (broadcastResponse.error) {
        throw new Error(broadcastResponse.reason || 'Transaction failed');
      }

      return broadcastResponse.txid;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }

  /**
   * Validate if an address is a valid Stacks principal
   */
  validateAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic Stacks address validation
    // Mainnet addresses start with 'SP' or 'SM'
    // Testnet addresses start with 'ST' or 'SN'
    const addressRegex = /^S[TPMN][0-9A-Z]{39}$/;
    return addressRegex.test(address);
  }

  /**
   * Format amount from base units to display format
   */
  formatAmount(amount: bigint, decimals: number = 6): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return `${wholePart}.${trimmedFractional}`;
  }

  /**
   * Parse amount from display format to base units
   */
  parseAmount(amount: string, decimals: number = 6): bigint {
    if (!amount || amount.trim() === '') {
      throw new Error('Amount cannot be empty');
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const multiplier = BigInt(10 ** decimals);
    const wholePart = BigInt(Math.floor(numericAmount));
    const fractionalPart = numericAmount - Math.floor(numericAmount);
    const fractionalBigInt = BigInt(Math.round(fractionalPart * (10 ** decimals)));
    
    return wholePart * multiplier + fractionalBigInt;
  }

  /**
   * Validate if amount is positive and properly formatted
   */
  validateAmount(amount: string): boolean {
    if (!amount || amount.trim() === '') {
      return false;
    }

    const numericAmount = parseFloat(amount);
    return !isNaN(numericAmount) && numericAmount > 0;
  }

  /**
   * Get token metadata
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    try {
      const [nameResult, symbolResult, decimalsResult, supplyResult] = await Promise.all([
        callReadOnlyFunction({
          contractAddress: this.contractAddress,
          contractName: this.contractName,
          functionName: 'get-name',
          functionArgs: [],
          network: this.network,
          senderAddress: this.contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress: this.contractAddress,
          contractName: this.contractName,
          functionName: 'get-symbol',
          functionArgs: [],
          network: this.network,
          senderAddress: this.contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress: this.contractAddress,
          contractName: this.contractName,
          functionName: 'get-decimals',
          functionArgs: [],
          network: this.network,
          senderAddress: this.contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress: this.contractAddress,
          contractName: this.contractName,
          functionName: 'get-total-supply',
          functionArgs: [],
          network: this.network,
          senderAddress: this.contractAddress,
        }),
      ]);

      return {
        name: cvToValue(nameResult).value as string,
        symbol: cvToValue(symbolResult).value as string,
        decimals: Number(cvToValue(decimalsResult).value),
        totalSupply: BigInt(cvToValue(supplyResult).value as string),
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw new Error('Failed to fetch token information');
    }
  }
}

// Default configuration for testnet
export const createDefaultTokenService = (): TokenService => {
  return new TokenService({
    network: new StacksTestnet(),
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual deployer address
    contractName: 'bitdap-token',
  });
};