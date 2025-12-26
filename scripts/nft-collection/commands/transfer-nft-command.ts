/**
 * NFT Transfer Command
 * Handles transfer operations for NFTs in the collection
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { WalletInterface } from '../../wallet/wallet-interface.js';
import { Logger } from '../../logging/logger.js';
import { NFTTransferRequest, NFTOperationResult } from '../types.js';
import chalk from 'chalk';

export class TransferNFTCommand {
  private contractInterface: NFTContractInterface;
  private walletInterface: WalletInterface;
  private logger: Logger;

  constructor() {
    this.contractInterface = new NFTContractInterface();
    this.walletInterface = new WalletInterface();
    this.logger = Logger.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'nft-transfer',
      description: 'Transfer NFTs to another address',
      aliases: ['transfer-nft', 'nt'],
      parameters: [
        {
          name: 'token-id',
          type: 'number',
          required: true,
          description: 'ID of the NFT to transfer',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'from',
          type: 'address',
          required: true,
          description: 'Current owner address'
        },
        {
          name: 'to',
          type: 'address',
          required: true,
          description: 'Recipient address'
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
        'npm run token-interact nft-transfer --token-id 1 --from ST1SENDER... --to ST1RECIPIENT... --private-key YOUR_KEY',
        'npm run token-interact transfer-nft --token-id 5 --from ST1SENDER... --to ST1RECIPIENT... --memo "Gift" --private-key YOUR_KEY'
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
      from,
      to,
      'private-key': privateKey,
      memo
    } = args;

    try {
      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Validate addresses
      if (!this.walletInterface.validateAddress(from)) {
        throw new Error('Invalid sender address format');
      }

      if (!this.walletInterface.validateAddress(to)) {
        throw new Error('Invalid recipient address format');
      }

      // Check for self-transfer
      if (from === to) {
        throw new Error('Cannot transfer NFT to yourself');
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Sender:'), from);
      console.log(chalk.blue('🎯 Recipient:'), to);
      console.log(chalk.blue('🎫 Token ID:'), tokenId);

      // Verify wallet matches sender
      if (walletInfo.address !== from) {
        throw new Error('Private key does not match sender address');
      }

      // Check contract status
      const contractStatus = await this.contractInterface.getContractStatus();
      if (contractStatus?.paused) {
        throw new Error('Contract is currently paused. Transfers are disabled.');
      }

      // Verify token exists and get current owner
      const tokenExists = await this.contractInterface.tokenExists(tokenId);
      if (!tokenExists) {
        throw new Error(`NFT ${tokenId} does not exist`);
      }

      const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
      if (!currentOwner) {
        throw new Error(`Failed to get owner of NFT ${tokenId}`);
      }

      // Verify ownership
      if (currentOwner !== from) {
        throw new Error(`NFT ${tokenId} is not owned by ${from}. Current owner: ${currentOwner}`);
      }

      // Get token URI for display
      const tokenURI = await this.contractInterface.getTokenURI(tokenId);
      console.log(chalk.blue('🔗 Token URI:'), tokenURI || 'None');

      // Display transaction summary
      const summary = this.walletInterface.prepareTransactionSummary(
        'transfer',
        { 
          tokenId,
          from,
          to,
          memo: memo || 'none'
        }
      );
      console.log(summary);

      // Execute transfer
      console.log(chalk.blue('🔄 Transferring NFT...'));
      
      const result = await this.contractInterface.transferNFT(
        tokenId,
        from,
        to,
        privateKey
      );

      if (result.success) {
        console.log(chalk.green('✅ NFT transferred successfully!'));
        console.log(chalk.blue('📝 Transaction ID:'), result.txId);
        
        // Verify the transfer
        const newOwner = await this.contractInterface.getTokenOwner(tokenId);
        console.log(chalk.green('✅ New owner verified:'), newOwner);
        
        this.logger.info('NFT transferred successfully', {
          tokenId,
          from,
          to,
          memo,
          txId: result.txId
        });

        return {
          success: true,
          txId: result.txId,
          message: 'NFT transferred successfully',
          data: {
            tokenId,
            from,
            to,
            newOwner,
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
      this.logger.error('NFT transfer command failed', {
        tokenId,
        from,
        to,
        memo,
        error: error.message
      });
      
      console.log(chalk.red('❌ Transfer failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'TRANSFER_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'NFT transfer operation failed'
      };
    }
  }

  /**
   * Check transfer eligibility
   */
  public async checkTransferEligibility(
    tokenId: number,
    from: string,
    to: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // Check contract status
      const contractStatus = await this.contractInterface.getContractStatus();
      if (contractStatus?.paused) {
        return { eligible: false, reason: 'Contract is paused' };
      }

      // Check token exists
      const tokenExists = await this.contractInterface.tokenExists(tokenId);
      if (!tokenExists) {
        return { eligible: false, reason: 'Token does not exist' };
      }

      // Check ownership
      const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
      if (currentOwner !== from) {
        return { eligible: false, reason: 'Sender is not the owner' };
      }

      // Check for self-transfer
      if (from === to) {
        return { eligible: false, reason: 'Cannot transfer to yourself' };
      }

      return { eligible: true };

    } catch (error) {
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }
}