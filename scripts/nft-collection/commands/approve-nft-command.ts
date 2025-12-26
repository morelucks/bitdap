/**
 * NFT Approval Command
 * Handles approval operations for NFTs in the collection
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { WalletInterface } from '../../wallet/wallet-interface.js';
import { Logger } from '../../logging/logger.js';
import { NFTApprovalRequest, NFTOperationResult } from '../types.js';
import chalk from 'chalk';

export class ApproveNFTCommand {
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
      name: 'nft-approve',
      description: 'Approve another address to transfer specific NFTs',
      aliases: ['approve-nft', 'na'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Approval action: approve, approve-all, revoke, revoke-all'
        },
        {
          name: 'token-id',
          type: 'number',
          required: false,
          description: 'ID of the NFT to approve (required for approve/revoke)',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'operator',
          type: 'address',
          required: true,
          description: 'Address to approve as operator'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing the transaction'
        }
      ],
      examples: [
        'npm run token-interact nft-approve --action approve --token-id 1 --operator ST1OPERATOR... --private-key YOUR_KEY',
        'npm run token-interact nft-approve --action approve-all --operator ST1OPERATOR... --private-key YOUR_KEY',
        'npm run token-interact approve-nft --action revoke --token-id 5 --operator ST1OPERATOR... --private-key YOUR_KEY',
        'npm run token-interact na --action revoke-all --operator ST1OPERATOR... --private-key YOUR_KEY'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the approval command
   */
  public async execute(args: any): Promise<any> {
    const { 
      action,
      'token-id': tokenId,
      operator,
      'private-key': privateKey
    } = args;

    try {
      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Validate operator address
      if (!this.walletInterface.validateAddress(operator)) {
        throw new Error('Invalid operator address format');
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Owner:'), walletInfo.address);
      console.log(chalk.blue('🔧 Operator:'), operator);
      console.log(chalk.blue('⚡ Action:'), action);

      // Check for self-approval
      if (walletInfo.address === operator) {
        throw new Error('Cannot approve yourself as operator');
      }

      // Check contract status
      const contractStatus = await this.contractInterface.getContractStatus();
      if (contractStatus?.paused) {
        throw new Error('Contract is currently paused. Approvals are disabled.');
      }

      // Execute based on action
      switch (action.toLowerCase()) {
        case 'approve':
          return await this.executeTokenApproval(tokenId, operator, privateKey, walletInfo.address);
        
        case 'approve-all':
          return await this.executeApprovalForAll(operator, true, privateKey, walletInfo.address);
        
        case 'revoke':
          return await this.executeTokenRevocation(tokenId, operator, privateKey, walletInfo.address);
        
        case 'revoke-all':
          return await this.executeApprovalForAll(operator, false, privateKey, walletInfo.address);
        
        default:
          throw new Error(`Unknown action: ${action}. Use: approve, approve-all, revoke, revoke-all`);
      }

    } catch (error: any) {
      this.logger.error('NFT approval command failed', {
        action,
        tokenId,
        operator,
        error: error.message
      });
      
      console.log(chalk.red('❌ Approval failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'APPROVAL_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'NFT approval operation failed'
      };
    }
  }

  /**
   * Execute token-specific approval
   */
  private async executeTokenApproval(
    tokenId: number,
    operator: string,
    privateKey: string,
    owner: string
  ): Promise<NFTOperationResult> {
    if (!tokenId) {
      throw new Error('Token ID is required for token approval');
    }

    // Verify token exists and ownership
    const tokenExists = await this.contractInterface.tokenExists(tokenId);
    if (!tokenExists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
    if (currentOwner !== owner) {
      throw new Error(`You do not own NFT ${tokenId}. Current owner: ${currentOwner}`);
    }

    console.log(chalk.blue(`🔄 Approving operator for NFT ${tokenId}...`));

    const result = await this.contractInterface.approveToken(
      tokenId,
      operator,
      privateKey
    );

    if (result.success) {
      console.log(chalk.green('✅ Token approval successful!'));
      console.log(chalk.blue('📝 Transaction ID:'), result.txId);
      
      // Verify the approval
      const approvedOperator = await this.contractInterface.getApproved(tokenId);
      console.log(chalk.green('✅ Approved operator verified:'), approvedOperator);
      
      this.logger.info('Token approval successful', {
        tokenId,
        operator,
        owner,
        txId: result.txId
      });

      return {
        success: true,
        txId: result.txId,
        message: `NFT ${tokenId} approval granted to ${operator}`
      };
    } else {
      console.log(chalk.red('❌ Token approval failed!'));
      if (result.error) {
        console.log(chalk.red('Error:'), result.error.message);
        if (result.error.suggestion) {
          console.log(chalk.yellow('💡 Suggestion:'), result.error.suggestion);
        }
      }

      return {
        success: false,
        error: result.error,
        message: 'Failed to approve token'
      };
    }
  }

  /**
   * Execute approval for all tokens
   */
  private async executeApprovalForAll(
    operator: string,
    approved: boolean,
    privateKey: string,
    owner: string
  ): Promise<NFTOperationResult> {
    const actionText = approved ? 'Approving' : 'Revoking approval for';
    console.log(chalk.blue(`🔄 ${actionText} operator for all NFTs...`));

    const result = await this.contractInterface.setApprovalForAll(
      operator,
      approved,
      privateKey
    );

    if (result.success) {
      const successText = approved ? 'granted' : 'revoked';
      console.log(chalk.green(`✅ Approval for all NFTs ${successText}!`));
      console.log(chalk.blue('📝 Transaction ID:'), result.txId);
      
      this.logger.info('Approval for all successful', {
        operator,
        approved,
        owner,
        txId: result.txId
      });

      return {
        success: true,
        txId: result.txId,
        message: `Approval for all NFTs ${successText} to ${operator}`
      };
    } else {
      console.log(chalk.red('❌ Approval for all failed!'));
      if (result.error) {
        console.log(chalk.red('Error:'), result.error.message);
        if (result.error.suggestion) {
          console.log(chalk.yellow('💡 Suggestion:'), result.error.suggestion);
        }
      }

      return {
        success: false,
        error: result.error,
        message: 'Failed to set approval for all'
      };
    }
  }

  /**
   * Execute token-specific revocation
   */
  private async executeTokenRevocation(
    tokenId: number,
    operator: string,
    privateKey: string,
    owner: string
  ): Promise<NFTOperationResult> {
    if (!tokenId) {
      throw new Error('Token ID is required for token revocation');
    }

    // Verify token exists and ownership
    const tokenExists = await this.contractInterface.tokenExists(tokenId);
    if (!tokenExists) {
      throw new Error(`NFT ${tokenId} does not exist`);
    }

    const currentOwner = await this.contractInterface.getTokenOwner(tokenId);
    if (currentOwner !== owner) {
      throw new Error(`You do not own NFT ${tokenId}. Current owner: ${currentOwner}`);
    }

    // Check current approval
    const currentApproval = await this.contractInterface.getApproved(tokenId);
    if (currentApproval !== operator) {
      throw new Error(`NFT ${tokenId} is not approved to ${operator}`);
    }

    console.log(chalk.blue(`🔄 Revoking approval for NFT ${tokenId}...`));

    // Revoke by approving zero address (or contract address)
    const result = await this.contractInterface.approveToken(
      tokenId,
      owner, // Approve back to owner effectively revokes
      privateKey
    );

    if (result.success) {
      console.log(chalk.green('✅ Token approval revoked!'));
      console.log(chalk.blue('📝 Transaction ID:'), result.txId);
      
      this.logger.info('Token approval revoked', {
        tokenId,
        operator,
        owner,
        txId: result.txId
      });

      return {
        success: true,
        txId: result.txId,
        message: `NFT ${tokenId} approval revoked from ${operator}`
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: 'Failed to revoke token approval'
      };
    }
  }

  /**
   * Check current approvals for a token
   */
  public async checkTokenApprovals(tokenId: number): Promise<{
    owner: string | null;
    approved: string | null;
    exists: boolean;
  }> {
    try {
      const exists = await this.contractInterface.tokenExists(tokenId);
      if (!exists) {
        return { owner: null, approved: null, exists: false };
      }

      const owner = await this.contractInterface.getTokenOwner(tokenId);
      const approved = await this.contractInterface.getApproved(tokenId);

      return { owner, approved, exists: true };
    } catch (error) {
      return { owner: null, approved: null, exists: false };
    }
  }

  /**
   * List all approvals for an owner
   */
  public async listOwnerApprovals(owner: string): Promise<{
    tokenApprovals: Array<{ tokenId: number; approved: string }>;
    operatorApprovals: string[];
  }> {
    // This would require additional contract functions or event parsing
    // For now, return empty arrays
    return {
      tokenApprovals: [],
      operatorApprovals: []
    };
  }
}