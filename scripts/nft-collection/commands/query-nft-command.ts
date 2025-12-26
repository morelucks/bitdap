/**
 * NFT Query Command
 * Handles querying NFT collection information and token data
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { Logger } from '../../logging/logger.js';
import { NFTQueryFilter, TokenDetails } from '../types.js';
import chalk from 'chalk';

export class QueryNFTCommand {
  private contractInterface: NFTContractInterface;
  private logger: Logger;

  constructor() {
    this.contractInterface = new NFTContractInterface();
    this.logger = Logger.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'nft-query',
      description: 'Query NFT collection information and token data',
      aliases: ['query-nft', 'nq'],
      parameters: [
        {
          name: 'type',
          type: 'string',
          required: true,
          description: 'Type of query to perform'
        },
        {
          name: 'token-id',
          type: 'number',
          required: false,
          description: 'Token ID (required for token-specific queries)',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'owner',
          type: 'address',
          required: false,
          description: 'Owner address (for ownership queries)'
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Maximum number of results to return'
        },
        {
          name: 'offset',
          type: 'number',
          required: false,
          description: 'Number of results to skip'
        }
      ],
      examples: [
        'npm run token-interact nft-query --type collection',
        'npm run token-interact nft-query --type token --token-id 1',
        'npm run token-interact nft-query --type owner --token-id 5',
        'npm run token-interact nft-query --type mint-info',
        'npm run token-interact query-nft --type status',
        'npm run token-interact nq --type royalty'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the query command
   */
  public async execute(args: any): Promise<any> {
    const { 
      type, 
      'token-id': tokenId, 
      owner, 
      limit = 10, 
      offset = 0 
    } = args;

    try {
      console.log(chalk.blue('🔍 Executing NFT query:'), type);

      let result: any;

      switch (type.toLowerCase()) {
        case 'collection':
        case 'collection-info':
          result = await this.queryCollectionInfo();
          break;

        case 'token':
        case 'token-info':
          if (!tokenId) {
            throw new Error('Token ID parameter is required for token query');
          }
          result = await this.queryTokenInfo(tokenId);
          break;

        case 'owner':
        case 'token-owner':
          if (!tokenId) {
            throw new Error('Token ID parameter is required for owner query');
          }
          result = await this.queryTokenOwner(tokenId);
          break;

        case 'mint-info':
        case 'mint':
          result = await this.queryMintInfo();
          break;

        case 'status':
        case 'contract-status':
          result = await this.queryContractStatus();
          break;

        case 'royalty':
        case 'royalty-info':
          result = await this.queryRoyaltyInfo();
          break;

        case 'approved':
        case 'approval':
          if (!tokenId) {
            throw new Error('Token ID parameter is required for approval query');
          }
          result = await this.queryTokenApproval(tokenId);
          break;

        case 'exists':
        case 'token-exists':
          if (!tokenId) {
            throw new Error('Token ID parameter is required for existence query');
          }
          result = await this.queryTokenExists(tokenId);
          break;

        case 'supply':
        case 'total-supply':
          result = await this.querySupplyInfo();
          break;

        case 'metadata':
        case 'token-metadata':
          if (!tokenId) {
            throw new Error('Token ID parameter is required for metadata query');
          }
          result = await this.queryTokenMetadata(tokenId);
          break;

        default:
          throw new Error(`Unknown query type: ${type}. Available types: collection, token, owner, mint-info, status, royalty, approved, exists, supply, metadata`);
      }

      return {
        success: true,
        data: result,
        message: `Query completed successfully`
      };

    } catch (error: any) {
      this.logger.error('NFT query failed', { type, tokenId, owner, error: error.message });
      console.log(chalk.red('❌ Query failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Query operation failed'
      };
    }
  }

  /**
   * Query collection information
   */
  private async queryCollectionInfo(): Promise<any> {
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    
    if (!collectionInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    console.log(chalk.green('📚 Collection Information:'));
    console.log(`  Name: ${collectionInfo.name}`);
    console.log(`  Symbol: ${collectionInfo.symbol}`);
    console.log(`  Description: ${collectionInfo.description}`);
    console.log(`  URI: ${collectionInfo.uri || 'None'}`);
    console.log(`  Total Supply: ${collectionInfo.totalSupply}`);
    console.log(`  Max Supply: ${collectionInfo.maxSupply}`);
    console.log(`  Remaining: ${collectionInfo.remainingSupply}`);
    console.log(`  Owner: ${collectionInfo.owner}`);
    console.log(`  Minting Enabled: ${collectionInfo.mintingEnabled ? 'Yes' : 'No'}`);
    
    return collectionInfo;
  }

  /**
   * Query token information
   */
  private async queryTokenInfo(tokenId: number): Promise<any> {
    const exists = await this.contractInterface.tokenExists(tokenId);
    if (!exists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const owner = await this.contractInterface.getTokenOwner(tokenId);
    const uri = await this.contractInterface.getTokenURI(tokenId);
    const approved = await this.contractInterface.getApproved(tokenId);
    
    console.log(chalk.green('🎫 Token Information:'));
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  URI: ${uri || 'None'}`);
    console.log(`  Approved: ${approved || 'None'}`);
    console.log(`  Exists: Yes`);
    
    return {
      tokenId,
      owner,
      uri,
      approved,
      exists: true
    };
  }

  /**
   * Query token owner
   */
  private async queryTokenOwner(tokenId: number): Promise<any> {
    const exists = await this.contractInterface.tokenExists(tokenId);
    if (!exists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const owner = await this.contractInterface.getTokenOwner(tokenId);
    
    console.log(chalk.green('👤 Token Owner:'));
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Owner: ${owner}`);
    
    return {
      tokenId,
      owner,
      exists: true
    };
  }

  /**
   * Query mint information
   */
  private async queryMintInfo(): Promise<any> {
    const mintInfo = await this.contractInterface.getMintInfo();
    
    if (!mintInfo) {
      throw new Error('Failed to retrieve mint information');
    }

    console.log(chalk.green('💰 Mint Information:'));
    console.log(`  Price: ${mintInfo.price} microSTX`);
    console.log(`  Per Address Limit: ${mintInfo.perAddressLimit}`);
    console.log(`  Max Supply: ${mintInfo.maxSupply}`);
    console.log(`  Current Supply: ${mintInfo.currentSupply}`);
    console.log(`  Remaining: ${mintInfo.maxSupply - mintInfo.currentSupply}`);
    console.log(`  Minting Enabled: ${mintInfo.mintingEnabled ? 'Yes' : 'No'}`);
    
    return mintInfo;
  }

  /**
   * Query contract status
   */
  private async queryContractStatus(): Promise<any> {
    const status = await this.contractInterface.getContractStatus();
    
    if (!status) {
      throw new Error('Failed to retrieve contract status');
    }

    console.log(chalk.green('🔒 Contract Status:'));
    console.log(`  Paused: ${status.paused ? 'Yes' : 'No'}`);
    console.log(`  Minting Enabled: ${status.mintingEnabled ? 'Yes' : 'No'}`);
    console.log(`  Owner: ${status.owner}`);
    
    return status;
  }

  /**
   * Query royalty information
   */
  private async queryRoyaltyInfo(): Promise<any> {
    const royaltyInfo = await this.contractInterface.getRoyaltyInfo();
    
    if (!royaltyInfo) {
      throw new Error('Failed to retrieve royalty information');
    }

    console.log(chalk.green('💎 Royalty Information:'));
    console.log(`  Recipient: ${royaltyInfo.recipient}`);
    console.log(`  Percentage: ${royaltyInfo.percentage / 100}%`);
    console.log(`  Max Percentage: ${royaltyInfo.maxPercentage / 100}%`);
    console.log(`  Total Collected: ${royaltyInfo.totalCollected} microSTX`);
    
    return royaltyInfo;
  }

  /**
   * Query token approval
   */
  private async queryTokenApproval(tokenId: number): Promise<any> {
    const exists = await this.contractInterface.tokenExists(tokenId);
    if (!exists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const owner = await this.contractInterface.getTokenOwner(tokenId);
    const approved = await this.contractInterface.getApproved(tokenId);
    
    console.log(chalk.green('🔧 Token Approval:'));
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Approved: ${approved || 'None'}`);
    
    return {
      tokenId,
      owner,
      approved,
      hasApproval: !!approved
    };
  }

  /**
   * Query token existence
   */
  private async queryTokenExists(tokenId: number): Promise<any> {
    const exists = await this.contractInterface.tokenExists(tokenId);
    
    console.log(chalk.green('❓ Token Existence:'));
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Exists: ${exists ? 'Yes' : 'No'}`);
    
    return {
      tokenId,
      exists
    };
  }

  /**
   * Query supply information
   */
  private async querySupplyInfo(): Promise<any> {
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    
    if (!collectionInfo) {
      throw new Error('Failed to retrieve supply information');
    }

    console.log(chalk.green('📊 Supply Information:'));
    console.log(`  Total Supply: ${collectionInfo.totalSupply}`);
    console.log(`  Max Supply: ${collectionInfo.maxSupply}`);
    console.log(`  Remaining: ${collectionInfo.remainingSupply}`);
    console.log(`  Percentage Minted: ${((collectionInfo.totalSupply / collectionInfo.maxSupply) * 100).toFixed(2)}%`);
    
    return {
      totalSupply: collectionInfo.totalSupply,
      maxSupply: collectionInfo.maxSupply,
      remainingSupply: collectionInfo.remainingSupply,
      percentageMinted: ((collectionInfo.totalSupply / collectionInfo.maxSupply) * 100).toFixed(2)
    };
  }

  /**
   * Query token metadata
   */
  private async queryTokenMetadata(tokenId: number): Promise<any> {
    const exists = await this.contractInterface.tokenExists(tokenId);
    if (!exists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const uri = await this.contractInterface.getTokenURI(tokenId);
    
    console.log(chalk.green('📄 Token Metadata:'));
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  URI: ${uri || 'None'}`);
    
    // If URI exists, try to fetch metadata
    let metadata = null;
    if (uri) {
      try {
        // This would fetch the actual metadata from the URI
        // For now, just return the URI
        metadata = { uri };
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not fetch metadata from URI'));
      }
    }
    
    return {
      tokenId,
      uri,
      metadata,
      hasMetadata: !!uri
    };
  }

  /**
   * Query multiple tokens by range
   */
  public async queryTokenRange(startId: number, endId: number): Promise<TokenDetails[]> {
    const tokens: TokenDetails[] = [];
    
    for (let tokenId = startId; tokenId <= endId; tokenId++) {
      try {
        const exists = await this.contractInterface.tokenExists(tokenId);
        if (exists) {
          const owner = await this.contractInterface.getTokenOwner(tokenId);
          const uri = await this.contractInterface.getTokenURI(tokenId);
          const approved = await this.contractInterface.getApproved(tokenId);
          
          tokens.push({
            tokenId,
            owner: owner || '',
            uri,
            approved,
            exists: true
          });
        }
      } catch (error) {
        // Skip tokens that cause errors
        continue;
      }
    }
    
    return tokens;
  }

  /**
   * Get comprehensive collection statistics
   */
  public async getCollectionStatistics(): Promise<any> {
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    const royaltyInfo = await this.contractInterface.getRoyaltyInfo();
    const contractStatus = await this.contractInterface.getContractStatus();
    
    return {
      collection: collectionInfo,
      minting: mintInfo,
      royalty: royaltyInfo,
      status: contractStatus,
      generatedAt: new Date().toISOString()
    };
  }
}