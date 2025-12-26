/**
 * Mint Command
 * Handles minting new Bitdap Pass NFTs
 */

import { CommandDefinition, TransactionResult } from '../config/types.js';
import { ContractInterface } from '../contract/contract-interface.js';
import { WalletInterface } from '../wallet/wallet-interface.js';
import chalk from 'chalk';

export class MintCommand {
  private contractInterface: ContractInterface;
  private walletInterface: WalletInterface;

  constructor() {
    this.contractInterface = new ContractInterface();
    this.walletInterface = new WalletInterface();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'mint',
      description: 'Mint a new Bitdap Pass NFT',
      aliases: ['m', 'create'],
      parameters: [
        {
          name: 'tier',
          type: 'number',
          required: true,
          description: 'Tier of the pass (1=Basic, 2=Pro, 3=VIP)',
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
          name: 'uri',
          type: 'string',
          required: false,
          description: 'Optional metadata URI for the token'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing the transaction'
        }
      ],
      examples: [
        'npm run token-interact mint --tier 1 --private-key YOUR_PRIVATE_KEY',
        'npm run token-interact mint --tier 2 --uri "https://example.com/metadata.json" --private-key YOUR_PRIVATE_KEY',
        'npm run token-interact m --tier 3 --private-key YOUR_PRIVATE_KEY'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the mint command
   */
  public async execute(args: any): Promise<any> {
    const { tier, uri, 'private-key': privateKey } = args;

    try {
      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Wallet:'), walletInfo.address);

      // Check network compatibility
      if (!this.walletInterface.validateNetworkConnection(walletInfo.address)) {
        console.log(chalk.yellow('⚠️  Warning: Wallet network may not match configured network'));
      }

      // Check if contract is paused
      const isPaused = await this.contractInterface.isPaused();
      if (isPaused) {
        throw new Error('Contract is currently paused. Minting is disabled.');
      }

      // Get current supply info
      const totalSupply = await this.contractInterface.getTotalSupply();
      const tierSupply = await this.contractInterface.getTierSupply(tier);
      
      console.log(chalk.blue('📊 Current Supply:'));
      console.log(`  Total: ${totalSupply}`);
      console.log(`  Tier ${tier}: ${tierSupply}`);

      // Display transaction summary
      const summary = this.walletInterface.prepareTransactionSummary(
        'mint-pass',
        { tier, uri: uri || 'none' }
      );
      console.log(summary);

      // Execute mint transaction
      console.log(chalk.blue('🔄 Submitting mint transaction...'));
      
      const result: TransactionResult = await this.contractInterface.mintPass(
        tier,
        uri || null,
        privateKey
      );

      if (result.success) {
        console.log(chalk.green('✅ Mint successful!'));
        console.log(chalk.blue('📝 Transaction ID:'), result.txId);
        
        // Get updated supply
        const newTotalSupply = await this.contractInterface.getTotalSupply();
        const newTierSupply = await this.contractInterface.getTierSupply(tier);
        
        return {
          success: true,
          txId: result.txId,
          message: 'NFT minted successfully',
          data: {
            tier,
            uri: uri || null,
            wallet: walletInfo.address,
            previousSupply: {
              total: totalSupply,
              tier: tierSupply
            },
            newSupply: {
              total: newTotalSupply,
              tier: newTierSupply
            }
          }
        };
      } else {
        console.log(chalk.red('❌ Mint failed!'));
        if (result.error) {
          console.log(chalk.red('Error:'), result.error.message);
          if (result.error.suggestion) {
            console.log(chalk.yellow('💡 Suggestion:'), result.error.suggestion);
          }
        }

        return {
          success: false,
          error: result.error,
          message: 'Failed to mint NFT'
        };
      }

    } catch (error: any) {
      console.log(chalk.red('❌ Mint command failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'MINT_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Mint operation failed'
      };
    }
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
   * Validate tier limits
   */
  private async validateTierLimits(tier: number): Promise<void> {
    const tierSupply = await this.contractInterface.getTierSupply(tier);
    
    const tierLimits: Record<number, number> = {
      1: 7000,  // Basic
      2: 2500,  // Pro
      3: 500    // VIP
    };

    const limit = tierLimits[tier];
    if (limit && tierSupply >= limit) {
      throw new Error(`Tier ${tier} (${this.getTierName(tier)}) has reached its maximum supply of ${limit}`);
    }
  }

  /**
   * Estimate transaction fee
   */
  private async estimateTransactionFee(): Promise<number> {
    // This would implement actual fee estimation
    // For now, return a reasonable estimate
    return 1000; // 0.001 STX in microSTX
  }
}