/**
 * Query Command
 * Handles querying contract information and token data
 */

import { CommandDefinition } from '../config/types.js';
import { ContractInterface } from '../contract/contract-interface.js';
import chalk from 'chalk';

export class QueryCommand {
  private contractInterface: ContractInterface;

  constructor() {
    this.contractInterface = new ContractInterface();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'query',
      description: 'Query contract information and token data',
      aliases: ['q', 'info', 'get'],
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
          description: 'Token ID (required for token and owner queries)',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'tier',
          type: 'number',
          required: false,
          description: 'Tier number (required for tier supply queries)',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Tier must be at least 1'
            },
            {
              type: 'max',
              value: 3,
              message: 'Tier must be at most 3'
            }
          ]
        },
        {
          name: 'address',
          type: 'address',
          required: false,
          description: 'Address to query (for balance and ownership queries)'
        }
      ],
      examples: [
        'npm run token-interact query --type supply',
        'npm run token-interact query --type token --token-id 1',
        'npm run token-interact query --type owner --token-id 5',
        'npm run token-interact query --type tier-supply --tier 2',
        'npm run token-interact q --type counters'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the query command
   */
  public async execute(args: any): Promise<any> {
    const { type, 'token-id': tokenId, tier, address } = args;

    try {
      console.log(chalk.blue('🔍 Executing query:'), type);

      let result: any;

      switch (type.toLowerCase()) {
        case 'supply':
        case 'total-supply':
          result = await this.queryTotalSupply();
          break;

        case 'tier-supply':
          if (!tier) {
            throw new Error('Tier parameter is required for tier-supply query');
          }
          result = await this.queryTierSupply(tier);
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

        case 'counters':
        case 'stats':
          result = await this.queryCounters();
          break;

        case 'all-tiers':
        case 'tiers':
          result = await this.queryAllTiers();
          break;

        case 'contract-info':
        case 'contract':
          result = await this.queryContractInfo();
          break;

        case 'paused':
        case 'status':
          result = await this.queryContractStatus();
          break;

        default:
          throw new Error(`Unknown query type: ${type}. Available types: supply, tier-supply, token, owner, counters, all-tiers, contract-info, paused`);
      }

      return {
        success: true,
        data: result,
        message: `Query completed successfully`
      };

    } catch (error: any) {
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
   * Query total supply
   */
  private async queryTotalSupply(): Promise<any> {
    const totalSupply = await this.contractInterface.getTotalSupply();
    
    console.log(chalk.green('📊 Total Supply:'), totalSupply);
    
    return {
      totalSupply,
      maxSupply: 10000,
      remaining: 10000 - totalSupply
    };
  }

  /**
   * Query tier supply
   */
  private async queryTierSupply(tier: number): Promise<any> {
    const tierSupply = await this.contractInterface.getTierSupply(tier);
    const tierName = this.getTierName(tier);
    const maxSupply = this.getTierMaxSupply(tier);
    
    console.log(chalk.green(`📊 ${tierName} Tier (${tier}) Supply:`), tierSupply);
    console.log(chalk.blue('Max Supply:'), maxSupply);
    console.log(chalk.blue('Remaining:'), maxSupply - tierSupply);
    
    return {
      tier,
      tierName,
      supply: tierSupply,
      maxSupply,
      remaining: maxSupply - tierSupply,
      percentageMinted: ((tierSupply / maxSupply) * 100).toFixed(2)
    };
  }

  /**
   * Query token information
   */
  private async queryTokenInfo(tokenId: number): Promise<any> {
    const owner = await this.contractInterface.getTokenOwner(tokenId);
    const metadata = await this.contractInterface.getTokenMetadata(tokenId);
    
    if (!owner) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    
    console.log(chalk.green('🎫 Token Information:'));
    console.log(`  ID: ${tokenId}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Tier: ${metadata?.tier || 'Unknown'} (${this.getTierName(metadata?.tier)})`);
    console.log(`  URI: ${metadata?.uri || 'None'}`);
    
    return {
      tokenId,
      owner,
      tier: metadata?.tier,
      tierName: this.getTierName(metadata?.tier),
      uri: metadata?.uri || null,
      exists: true
    };
  }

  /**
   * Query token owner
   */
  private async queryTokenOwner(tokenId: number): Promise<any> {
    const owner = await this.contractInterface.getTokenOwner(tokenId);
    
    if (!owner) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    
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
   * Query contract counters
   */
  private async queryCounters(): Promise<any> {
    const counters = await this.contractInterface.getCounters();
    
    console.log(chalk.green('📈 Contract Statistics:'));
    console.log(`  Users: ${counters?.users || 0}`);
    console.log(`  Listings: ${counters?.listings || 0}`);
    console.log(`  Transactions: ${counters?.transactions || 0}`);
    
    return {
      users: counters?.users || 0,
      listings: counters?.listings || 0,
      transactions: counters?.transactions || 0
    };
  }

  /**
   * Query all tier information
   */
  private async queryAllTiers(): Promise<any> {
    const tiers = [];
    
    for (let tier = 1; tier <= 3; tier++) {
      const supply = await this.contractInterface.getTierSupply(tier);
      const maxSupply = this.getTierMaxSupply(tier);
      
      tiers.push({
        tier,
        name: this.getTierName(tier),
        supply,
        maxSupply,
        remaining: maxSupply - supply,
        percentageMinted: ((supply / maxSupply) * 100).toFixed(2)
      });
    }
    
    console.log(chalk.green('📊 All Tier Information:'));
    tiers.forEach(tierInfo => {
      console.log(`  ${tierInfo.name} (${tierInfo.tier}): ${tierInfo.supply}/${tierInfo.maxSupply} (${tierInfo.percentageMinted}%)`);
    });
    
    return { tiers };
  }

  /**
   * Query contract information
   */
  private async queryContractInfo(): Promise<any> {
    const totalSupply = await this.contractInterface.getTotalSupply();
    const isPaused = await this.contractInterface.isPaused();
    const counters = await this.contractInterface.getCounters();
    
    console.log(chalk.green('📋 Contract Information:'));
    console.log(`  Total Supply: ${totalSupply}`);
    console.log(`  Status: ${isPaused ? 'Paused' : 'Active'}`);
    console.log(`  Users: ${counters?.users || 0}`);
    console.log(`  Transactions: ${counters?.transactions || 0}`);
    
    return {
      totalSupply,
      maxSupply: 10000,
      isPaused,
      status: isPaused ? 'paused' : 'active',
      users: counters?.users || 0,
      transactions: counters?.transactions || 0
    };
  }

  /**
   * Query contract status
   */
  private async queryContractStatus(): Promise<any> {
    const isPaused = await this.contractInterface.isPaused();
    
    console.log(chalk.green('🔒 Contract Status:'));
    console.log(`  Paused: ${isPaused ? 'Yes' : 'No'}`);
    console.log(`  Status: ${isPaused ? 'Inactive' : 'Active'}`);
    
    return {
      isPaused,
      status: isPaused ? 'paused' : 'active',
      message: isPaused ? 'Contract operations are currently disabled' : 'Contract is operating normally'
    };
  }

  /**
   * Get tier name from number
   */
  private getTierName(tier: number): string {
    const tierNames: Record<number, string> = {
      1: 'Basic',
      2: 'Pro',
      3: 'VIP'
    };
    return tierNames[tier] || 'Unknown';
  }

  /**
   * Get tier maximum supply
   */
  private getTierMaxSupply(tier: number): number {
    const tierMaxSupplies: Record<number, number> = {
      1: 7000,  // Basic
      2: 2500,  // Pro
      3: 500    // VIP
    };
    return tierMaxSupplies[tier] || 0;
  }
}