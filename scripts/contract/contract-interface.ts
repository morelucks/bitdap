/**
 * Contract Interface
 * Manages all interactions with the Bitdap smart contract
 */

import { StacksMainnet, StacksTestnet, StacksNetwork } from '@stacks/network';
import { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  callReadOnlyFunction,
  cvToJSON,
  hexToCV
} from '@stacks/transactions';
import { 
  standardPrincipalCV,
  uintCV,
  stringUtf8CV,
  optionalCVOf,
  noneCV,
  someCV,
  ClarityValue
} from '@stacks/transactions';
import { ConfigManager } from '../config/config-manager.js';
import { TransactionResult, ContractEvent } from '../config/types.js';

export class ContractInterface {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string = 'bitdap';
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    const config = this.configManager.getConfig();
    
    this.network = config.network.type === 'mainnet' 
      ? new StacksMainnet() 
      : new StacksTestnet();
    
    this.contractAddress = config.network.contractAddress;
  }

  /**
   * Create a contract call transaction
   */
  public async createContractCall(
    functionName: string,
    functionArgs: ClarityValue[],
    senderKey: string,
    postConditions: any[] = []
  ) {
    return makeContractCall({
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName,
      functionArgs,
      senderKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      postConditions
    });
  }

  /**
   * Submit transaction to the network
   */
  public async submitTransaction(transaction: any): Promise<TransactionResult> {
    try {
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      if (broadcastResponse.error) {
        return {
          txId: '',
          success: false,
          events: [],
          gasUsed: 0,
          fee: 0,
          error: {
            code: broadcastResponse.error.errorCode || 500,
            message: broadcastResponse.error.message || 'Transaction failed',
            suggestion: this.getErrorSuggestion(broadcastResponse.error.errorCode)
          }
        };
      }

      return {
        txId: broadcastResponse.txid,
        success: true,
        events: [],
        gasUsed: 0,
        fee: 0
      };
    } catch (error: any) {
      return {
        txId: '',
        success: false,
        events: [],
        gasUsed: 0,
        fee: 0,
        error: {
          code: 500,
          message: error.message || 'Unknown error',
          suggestion: 'Check network connection and try again'
        }
      };
    }
  }

  /**
   * Call read-only contract function
   */
  public async callReadOnlyFunction(
    functionName: string,
    functionArgs: ClarityValue[] = [],
    senderAddress?: string
  ): Promise<any> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName,
        functionArgs,
        senderAddress: senderAddress || this.contractAddress,
        network: this.network
      });

      return cvToJSON(result);
    } catch (error: any) {
      throw new Error(`Read-only call failed: ${error.message}`);
    }
  }

  /**
   * Mint a new Bitdap Pass NFT
   */
  public async mintPass(
    tier: number,
    uri: string | null,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      uintCV(tier),
      uri ? someCV(stringUtf8CV(uri)) : noneCV()
    ];

    const transaction = await this.createContractCall(
      'mint-pass',
      functionArgs,
      senderKey
    );

    return this.submitTransaction(transaction);
  }

  /**
   * Transfer a token to another address
   */
  public async transferToken(
    tokenId: number,
    recipient: string,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      uintCV(tokenId),
      standardPrincipalCV(recipient)
    ];

    const transaction = await this.createContractCall(
      'transfer',
      functionArgs,
      senderKey
    );

    return this.submitTransaction(transaction);
  }

  /**
   * Burn a token
   */
  public async burnToken(
    tokenId: number,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [uintCV(tokenId)];

    const transaction = await this.createContractCall(
      'burn',
      functionArgs,
      senderKey
    );

    return this.submitTransaction(transaction);
  }

  /**
   * Get token owner
   */
  public async getTokenOwner(tokenId: number): Promise<string | null> {
    try {
      const result = await this.callReadOnlyFunction('get-owner', [uintCV(tokenId)]);
      return result.success ? result.value.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token metadata
   */
  public async getTokenMetadata(tokenId: number): Promise<any> {
    try {
      const result = await this.callReadOnlyFunction('get-token-metadata', [uintCV(tokenId)]);
      return result.success ? result.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get total supply
   */
  public async getTotalSupply(): Promise<number> {
    try {
      const result = await this.callReadOnlyFunction('get-total-supply');
      return result.success ? parseInt(result.value.value) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get tier supply
   */
  public async getTierSupply(tier: number): Promise<number> {
    try {
      const result = await this.callReadOnlyFunction('get-tier-supply', [uintCV(tier)]);
      return result.success ? parseInt(result.value.value) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get contract counters
   */
  public async getCounters(): Promise<any> {
    try {
      const result = await this.callReadOnlyFunction('get-counters');
      return result.success ? result.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if contract is paused
   */
  public async isPaused(): Promise<boolean> {
    try {
      const result = await this.callReadOnlyFunction('is-paused');
      return result.success ? result.value.value : false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get error suggestion based on error code
   */
  private getErrorSuggestion(errorCode?: number): string {
    const suggestions: Record<number, string> = {
      100: 'Use tier 1 (Basic), 2 (Pro), or 3 (VIP)',
      101: 'Ensure token ID exists and is greater than 0',
      102: 'Set a positive price value in microSTX',
      200: 'Ensure you have the necessary permissions',
      201: 'Only token owners can perform this operation',
      300: 'Verify the resource exists and try again',
      400: 'No more tokens can be minted',
      500: 'Wait for contract to be unpaused by administrator'
    };

    return suggestions[errorCode || 0] || 'Check the transaction parameters and try again';
  }

  /**
   * Parse contract events from transaction result
   */
  public parseContractEvents(txResult: any): ContractEvent[] {
    // This would parse events from the transaction result
    // Implementation depends on the specific event format
    return [];
  }
}