/**
 * NFT Collection Contract Interface
 * Manages all interactions with the Bitdap NFT Collection smart contract
 */

import { StacksMainnet, StacksTestnet, StacksNetwork } from '@stacks/network';
import { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  callReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { 
  standardPrincipalCV,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  optionalCVOf,
  noneCV,
  someCV,
  listCV,
  tupleCV,
  boolCV,
  ClarityValue
} from '@stacks/transactions';
import { ConfigManager } from '../config/config-manager.js';
import { TransactionResult } from '../config/types.js';

export interface NFTCollectionInfo {
  name: string;
  symbol: string;
  description: string;
  uri: string | null;
  totalSupply: number;
  maxSupply: number;
  remainingSupply: number;
  owner: string;
  mintingEnabled: boolean;
}

export interface MintInfo {
  price: number;
  perAddressLimit: number;
  maxSupply: number;
  currentSupply: number;
  mintingEnabled: boolean;
}

export interface TokenInfo {
  tokenId: number;
  owner: string;
  uri: string | null;
  exists: boolean;
}

export interface RoyaltyInfo {
  recipient: string;
  percentage: number;
  maxPercentage: number;
  totalCollected: number;
}

export class NFTContractInterface {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string = 'bitdap-nft-collection';
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
   * Mint a new NFT
   */
  public async mintNFT(
    recipient: string,
    uri: string | null,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      standardPrincipalCV(recipient),
      uri ? someCV(stringUtf8CV(uri)) : noneCV()
    ];

    const transaction = await this.createContractCall(
      'mint',
      functionArgs,
      senderKey
    );

    return this.submitTransaction(transaction);
  }

  /**
   * Transfer NFT
   */
  public async transferNFT(
    tokenId: number,
    sender: string,
    recipient: string,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      uintCV(tokenId),
      standardPrincipalCV(sender),
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
   * Burn NFT
   */
  public async burnNFT(
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
   * Approve operator for token
   */
  public async approveToken(
    tokenId: number,
    approved: string,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      uintCV(tokenId),
      standardPrincipalCV(approved)
    ];

    const transaction = await this.createContractCall(
      'approve',
      functionArgs,
      senderKey
    );

    return this.submitTransaction(transaction);
  }

  /**
   * Set approval for all tokens
   */
  public async setApprovalForAll(
    operator: string,
    approved: boolean,
    senderKey: string
  ): Promise<TransactionResult> {
    const functionArgs = [
      standardPrincipalCV(operator),
      boolCV(approved)
    ];

    const transaction = await this.createContractCall(
      'set-approval-for-all',
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
      return result.success && result.value ? result.value.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token URI
   */
  public async getTokenURI(tokenId: number): Promise<string | null> {
    try {
      const result = await this.callReadOnlyFunction('get-token-uri', [uintCV(tokenId)]);
      return result.success && result.value ? result.value.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get collection information
   */
  public async getCollectionInfo(): Promise<NFTCollectionInfo | null> {
    try {
      const result = await this.callReadOnlyFunction('get-collection-info');
      if (result.success && result.value) {
        const data = result.value;
        return {
          name: data.name.value,
          symbol: data.symbol.value,
          description: data.description.value,
          uri: data.uri.value || null,
          totalSupply: parseInt(data['total-supply'].value),
          maxSupply: parseInt(data['max-supply'].value),
          remainingSupply: parseInt(data['remaining-supply'].value),
          owner: data.owner.value,
          mintingEnabled: data['minting-enabled'].value
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get mint information
   */
  public async getMintInfo(): Promise<MintInfo | null> {
    try {
      const result = await this.callReadOnlyFunction('get-mint-info');
      if (result.success && result.value) {
        const data = result.value;
        return {
          price: parseInt(data.price.value),
          perAddressLimit: parseInt(data['per-address-limit'].value),
          maxSupply: parseInt(data['max-supply'].value),
          currentSupply: parseInt(data['current-supply'].value),
          mintingEnabled: data['minting-enabled'].value
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get contract status
   */
  public async getContractStatus(): Promise<any> {
    try {
      const result = await this.callReadOnlyFunction('get-contract-status');
      return result.success ? result.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get royalty information
   */
  public async getRoyaltyInfo(): Promise<RoyaltyInfo | null> {
    try {
      const result = await this.callReadOnlyFunction('get-royalty-info');
      if (result.success && result.value) {
        const data = result.value;
        return {
          recipient: data.recipient.value,
          percentage: parseInt(data.percentage.value),
          maxPercentage: parseInt(data['max-percentage'].value),
          totalCollected: parseInt(data['total-collected'].value)
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token exists
   */
  public async tokenExists(tokenId: number): Promise<boolean> {
    try {
      const result = await this.callReadOnlyFunction('token-exists?', [uintCV(tokenId)]);
      return result.success ? result.value : false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get approved operator for token
   */
  public async getApproved(tokenId: number): Promise<string | null> {
    try {
      const result = await this.callReadOnlyFunction('get-approved', [uintCV(tokenId)]);
      return result.success && result.value ? result.value.value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get error suggestion based on error code
   */
  private getErrorSuggestion(errorCode?: number): string {
    const suggestions: Record<number, string> = {
      401: 'Ensure you have the necessary permissions',
      404: 'Token or resource not found',
      400: 'Invalid parameters provided',
      402: 'Insufficient payment or balance',
      403: 'Mint limit exceeded for this address',
      405: 'Maximum supply reached',
      406: 'Contract is paused',
      407: 'Cannot transfer to yourself',
      408: 'Invalid royalty percentage',
      409: 'Invalid recipient address',
      410: 'Token already exists',
      411: 'Minting is disabled',
      412: 'Invalid token ID',
      413: 'Batch operation limit exceeded',
      414: 'Invalid metadata provided',
      415: 'Transfer operation failed'
    };

    return suggestions[errorCode || 0] || 'Check the transaction parameters and try again';
  }
}