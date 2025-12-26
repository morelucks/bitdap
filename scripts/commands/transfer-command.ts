/**
 * Transfer Command
 * Handles transferring Bitdap Pass NFTs between addresses
 */

import { CommandDefinition, TransactionResult } from '../config/types.js';
import { ContractInterface } from '../contract/contract-interface.js';
import { WalletInterface } from '../wallet/wallet-interface.js';
import chalk from 'chalk';

export class TransferCommand {
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
      name: 'transfer',
      description: 'Transfer a Bitdap Pass NFT to another address',
      aliases: ['t', 'send'],
      parameters: [
        {
          name: 'token-id',
          type: 'number',
          required: true,
          description: 'ID of the token to transfer',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'recipient',
          type: 'address',
          required: true,
          description: 'Recipient Stacks address'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing the transaction'
        },
        {
          name: 'memo',
          type: 'string',
          required: false,
          description: 'Optional memo for the transfer'
        }
      ],
      examples: [
        'npm run token-interact transfer --token-id 1 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY',
        'npm run token-interact t --token-id 5 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY --memo "Gift"',
        'npm run token-interact send --token-id 10 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the transfer command
   */
  public async execute(args: any): Promise<any> {
    const { 
      'token-id': tokenId, 
      recipient, 
      'private-key': privateKey,
      memo 
    } = args;

    try {
      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Validate recipient address
      if (!this.walletInterface.validateAddress(recipient)) {
        throw new Error('Invalid recipient address format');
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Sender:'), walletInfo.address);
      console.log(chalk.blue('👤 Recipient:'), recipient);

      // Check for self-transfer
      if (walletInfo.address === recipient) {
        throw new Error('Cannot transfer token to yourself');
      }

      // Check if contract is paused
      const isPaused = await this.contractInterface.isPaused();
      if (isPaused) {
        throw new Error('Contract is currently paused. Transfers are disabled.');
      }

      // Verify token exists and get current owner
      const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
      if (!currentOwner) {
        throw new Error(`Token ${tokenId} does not exist`);
      }

      // Verify ownership
      if (currentOwner !== walletInfo.address) {
        throw new Error(`You do not own token ${tokenId}. Current owner: ${currentOwner}`);
      }

      // Get token metadata
      const metadata = await this.contractInterface.getTokenMetadata(tokenId);
      console.log(chalk.blue('🎫 Token Info:'));
      console.log(`  ID: ${tokenId}`);
      console.log(`  Tier: ${metadata?.tier || 'Unknown'} (${this.getTierName(metadata?.tier)})`);
      console.log(`  URI: ${metadata?.uri || 'None'}`);

      // Display transaction summary
      const summary = this.walletInterface.prepareTransactionSummary(
        'transfer',
        { 
          tokenId, 
          from: walletInfo.address,
          to: recipient,
          memo: memo || 'none'
        }
      );
      console.log(summary);

      // Execute transfer transaction
      console.log(chalk.blue('🔄 Submitting transfer transaction...'));
      
      const result: TransactionResult = await this.contractInterface.transferToken(
        tokenId,
        recipient,
        privateKey
      );

      if (result.success) {
        console.log(chalk.green('✅ Transfer successful!'));
        console.log(chalk.blue('📝 Transaction ID:'), result.txId);
        
        // Verify the transfer
        const newOwner = await this.contractInterface.getTokenOwner(tokenId);
        
        return {
          success: true,
          txId: result.txId,
          message: 'NFT transferred successfully',
          data: {
            tokenId,
            from: walletInfo.address,
            to: recipient,
            newOwner,
            tier: metadata?.tier,
            memo: memo || null
          }
        };
      } else {
        console.log(chalk.red('❌ Transfer failed!'));
        if (result.error) {
          console.log(chalk.red('Error:'), result.error.message);
          if (result.error.suggestion) {
            console.log(chalk.yellow('💡 Suggestion:'), result.error.suggestion);
          }
        }

        return {
          success: false,
          error: result.error,
          message: 'Failed to transfer NFT'
        };
      }

    } catch (error: any) {
      console.log(chalk.red('❌ Transfer command failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'TRANSFER_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Transfer operation failed'
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
   * Validate token ownership
   */
  private async validateTokenOwnership(tokenId: number, ownerAddress: string): Promise<void> {
    const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
    
    if (!currentOwner) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    
    if (currentOwner !== ownerAddress) {
      throw new Error(`You do not own token ${tokenId}. Current owner: ${currentOwner}`);
    }
  }

  /**
   * Check if recipient address is valid for the current network
   */
  private validateRecipientNetwork(recipient: string): boolean {
    return this.walletInterface.validateNetworkConnection(recipient);
  }

  /**
   * Get transfer history for a token (if available)
   */
  private async getTransferHistory(tokenId: number): Promise<any[]> {
    // This would query transfer events from the blockchain
    // For now, return empty array
    return [];
  }

  /**
   * Estimate transfer fee
   */
  private async estimateTransferFee(): Promise<number> {
    // This would implement actual fee estimation
    // For now, return a reasonable estimate
    return 500; // 0.0005 STX in microSTX
  }
}