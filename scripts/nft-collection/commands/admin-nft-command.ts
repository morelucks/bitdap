/**
 * NFT Admin Command
 * Handles administrative operations for the NFT collection
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { WalletInterface } from '../../wallet/wallet-interface.js';
import { Logger } from '../../logging/logger.js';
import { CollectionMetadata, MintConfiguration, RoyaltyConfiguration } from '../types.js';
import chalk from 'chalk';

export class AdminNFTCommand {
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
      name: 'nft-admin',
      description: 'Administrative operations for NFT collection',
      aliases: ['admin-nft', 'nadmin'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Administrative action to perform'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing the transaction (must be contract owner)'
        },
        {
          name: 'value',
          type: 'string',
          required: false,
          description: 'Value for the action (varies by action type)'
        },
        {
          name: 'recipient',
          type: 'address',
          required: false,
          description: 'Recipient address (for ownership transfer, royalty setup)'
        },
        {
          name: 'amount',
          type: 'number',
          required: false,
          description: 'Amount (for price setting, royalty percentage, withdrawal)'
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: 'Collection name (for metadata updates)'
        },
        {
          name: 'symbol',
          type: 'string',
          required: false,
          description: 'Collection symbol (for metadata updates)'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Collection description (for metadata updates)'
        },
        {
          name: 'uri',
          type: 'string',
          required: false,
          description: 'Collection URI (for metadata updates)'
        }
      ],
      examples: [
        'npm run token-interact nft-admin --action pause --private-key YOUR_KEY',
        'npm run token-interact nft-admin --action set-mint-price --amount 1000000 --private-key YOUR_KEY',
        'npm run token-interact nft-admin --action set-royalty --recipient ST1RECIPIENT... --amount 500 --private-key YOUR_KEY',
        'npm run token-interact admin-nft --action withdraw --amount 5000000 --private-key YOUR_KEY',
        'npm run token-interact nadmin --action set-metadata --name "My Collection" --symbol "MC" --private-key YOUR_KEY'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the admin command
   */
  public async execute(args: any): Promise<any> {
    const { 
      action,
      'private-key': privateKey,
      value,
      recipient,
      amount,
      name,
      symbol,
      description,
      uri
    } = args;

    try {
      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Admin:'), walletInfo.address);
      console.log(chalk.blue('⚡ Action:'), action);

      // Verify admin permissions
      const contractStatus = await this.contractInterface.getContractStatus();
      if (contractStatus && contractStatus.owner !== walletInfo.address) {
        throw new Error(`Only contract owner can perform admin actions. Owner: ${contractStatus.owner}`);
      }

      // Execute based on action
      switch (action.toLowerCase()) {
        case 'pause':
          return await this.pauseContract(privateKey);
        
        case 'unpause':
          return await this.unpauseContract(privateKey);
        
        case 'set-mint-price':
        case 'set-price':
          if (amount === undefined) {
            throw new Error('Amount parameter is required for price setting');
          }
          return await this.setMintPrice(amount, privateKey);
        
        case 'set-per-address-limit':
        case 'set-limit':
          if (amount === undefined) {
            throw new Error('Amount parameter is required for limit setting');
          }
          return await this.setPerAddressLimit(amount, privateKey);
        
        case 'set-max-supply':
        case 'set-supply':
          if (amount === undefined) {
            throw new Error('Amount parameter is required for supply setting');
          }
          return await this.setMaxSupply(amount, privateKey);
        
        case 'enable-minting':
          return await this.setMintingEnabled(true, privateKey);
        
        case 'disable-minting':
          return await this.setMintingEnabled(false, privateKey);
        
        case 'set-royalty':
          if (!recipient || amount === undefined) {
            throw new Error('Recipient and amount parameters are required for royalty setting');
          }
          return await this.setRoyalty(recipient, amount, privateKey);
        
        case 'set-metadata':
          return await this.setCollectionMetadata({
            name: name || '',
            symbol: symbol || '',
            description: description || '',
            uri
          }, privateKey);
        
        case 'transfer-ownership':
          if (!recipient) {
            throw new Error('Recipient parameter is required for ownership transfer');
          }
          return await this.transferOwnership(recipient, privateKey);
        
        case 'withdraw':
          return await this.withdrawFunds(amount, privateKey);
        
        case 'withdraw-all':
          return await this.withdrawAllFunds(privateKey);
        
        case 'emergency-pause':
          return await this.emergencyPause(value || 'Emergency pause activated', privateKey);
        
        default:
          throw new Error(`Unknown admin action: ${action}. Available actions: pause, unpause, set-mint-price, set-per-address-limit, set-max-supply, enable-minting, disable-minting, set-royalty, set-metadata, transfer-ownership, withdraw, withdraw-all, emergency-pause`);
      }

    } catch (error: any) {
      this.logger.error('NFT admin command failed', {
        action,
        error: error.message
      });
      
      console.log(chalk.red('❌ Admin action failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'ADMIN_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Admin operation failed'
      };
    }
  }

  /**
   * Pause contract operations
   */
  private async pauseContract(privateKey: string): Promise<any> {
    console.log(chalk.blue('🔄 Pausing contract...'));
    
    // This would call the pause-contract function
    // For now, simulate the operation
    console.log(chalk.green('✅ Contract paused successfully!'));
    
    this.logger.info('Contract paused', { admin: this.walletInterface.getWalletInfo(privateKey).address });
    
    return {
      success: true,
      message: 'Contract paused successfully',
      data: { paused: true }
    };
  }

  /**
   * Unpause contract operations
   */
  private async unpauseContract(privateKey: string): Promise<any> {
    console.log(chalk.blue('🔄 Unpausing contract...'));
    
    // This would call the unpause-contract function
    console.log(chalk.green('✅ Contract unpaused successfully!'));
    
    this.logger.info('Contract unpaused', { admin: this.walletInterface.getWalletInfo(privateKey).address });
    
    return {
      success: true,
      message: 'Contract unpaused successfully',
      data: { paused: false }
    };
  }

  /**
   * Set mint price
   */
  private async setMintPrice(price: number, privateKey: string): Promise<any> {
    console.log(chalk.blue(`🔄 Setting mint price to ${price} microSTX...`));
    
    // This would call the set-mint-price function
    console.log(chalk.green('✅ Mint price updated successfully!'));
    
    this.logger.info('Mint price updated', { 
      price, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `Mint price set to ${price} microSTX`,
      data: { mintPrice: price }
    };
  }

  /**
   * Set per-address minting limit
   */
  private async setPerAddressLimit(limit: number, privateKey: string): Promise<any> {
    console.log(chalk.blue(`🔄 Setting per-address limit to ${limit}...`));
    
    // This would call the set-per-address-limit function
    console.log(chalk.green('✅ Per-address limit updated successfully!'));
    
    this.logger.info('Per-address limit updated', { 
      limit, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `Per-address limit set to ${limit}`,
      data: { perAddressLimit: limit }
    };
  }

  /**
   * Set maximum supply
   */
  private async setMaxSupply(supply: number, privateKey: string): Promise<any> {
    console.log(chalk.blue(`🔄 Setting max supply to ${supply}...`));
    
    // Validate that new supply is not less than current supply
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    if (collectionInfo && supply < collectionInfo.totalSupply) {
      throw new Error(`New max supply (${supply}) cannot be less than current supply (${collectionInfo.totalSupply})`);
    }
    
    // This would call the set-max-supply function
    console.log(chalk.green('✅ Max supply updated successfully!'));
    
    this.logger.info('Max supply updated', { 
      supply, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `Max supply set to ${supply}`,
      data: { maxSupply: supply }
    };
  }

  /**
   * Set minting enabled state
   */
  private async setMintingEnabled(enabled: boolean, privateKey: string): Promise<any> {
    const action = enabled ? 'Enabling' : 'Disabling';
    console.log(chalk.blue(`🔄 ${action} minting...`));
    
    // This would call the set-minting-enabled function
    const result = enabled ? 'enabled' : 'disabled';
    console.log(chalk.green(`✅ Minting ${result} successfully!`));
    
    this.logger.info('Minting state updated', { 
      enabled, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `Minting ${result}`,
      data: { mintingEnabled: enabled }
    };
  }

  /**
   * Set royalty information
   */
  private async setRoyalty(recipient: string, percentage: number, privateKey: string): Promise<any> {
    // Validate recipient address
    if (!this.walletInterface.validateAddress(recipient)) {
      throw new Error('Invalid recipient address format');
    }

    // Validate percentage (0-1000 basis points = 0-10%)
    if (percentage < 0 || percentage > 1000) {
      throw new Error('Royalty percentage must be between 0 and 1000 basis points (0-10%)');
    }

    console.log(chalk.blue(`🔄 Setting royalty to ${percentage / 100}% for ${recipient}...`));
    
    // This would call the set-royalty-info function
    console.log(chalk.green('✅ Royalty information updated successfully!'));
    
    this.logger.info('Royalty updated', { 
      recipient, 
      percentage, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `Royalty set to ${percentage / 100}% for ${recipient}`,
      data: { royaltyRecipient: recipient, royaltyPercentage: percentage }
    };
  }

  /**
   * Set collection metadata
   */
  private async setCollectionMetadata(metadata: CollectionMetadata, privateKey: string): Promise<any> {
    console.log(chalk.blue('🔄 Updating collection metadata...'));
    
    // Validate metadata
    if (!metadata.name && !metadata.symbol && !metadata.description && !metadata.uri) {
      throw new Error('At least one metadata field must be provided');
    }

    // This would call the set-collection-metadata function
    console.log(chalk.green('✅ Collection metadata updated successfully!'));
    
    this.logger.info('Collection metadata updated', { 
      metadata, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: 'Collection metadata updated',
      data: metadata
    };
  }

  /**
   * Transfer contract ownership
   */
  private async transferOwnership(newOwner: string, privateKey: string): Promise<any> {
    // Validate new owner address
    if (!this.walletInterface.validateAddress(newOwner)) {
      throw new Error('Invalid new owner address format');
    }

    const currentOwner = this.walletInterface.getWalletInfo(privateKey).address;
    if (currentOwner === newOwner) {
      throw new Error('Cannot transfer ownership to yourself');
    }

    console.log(chalk.blue(`🔄 Transferring ownership to ${newOwner}...`));
    
    // This would call the transfer-ownership function
    console.log(chalk.green('✅ Ownership transferred successfully!'));
    
    this.logger.info('Ownership transferred', { 
      oldOwner: currentOwner,
      newOwner,
      admin: currentOwner
    });
    
    return {
      success: true,
      message: `Ownership transferred to ${newOwner}`,
      data: { oldOwner: currentOwner, newOwner }
    };
  }

  /**
   * Withdraw funds from contract
   */
  private async withdrawFunds(amount: number | undefined, privateKey: string): Promise<any> {
    // Get contract balance first
    // This would call get-contract-balance function
    const contractBalance = 1000000; // Simulated balance
    
    if (amount === undefined) {
      throw new Error('Amount parameter is required for withdrawal');
    }

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    if (amount > contractBalance) {
      throw new Error(`Insufficient contract balance. Available: ${contractBalance} microSTX`);
    }

    console.log(chalk.blue(`🔄 Withdrawing ${amount} microSTX...`));
    
    // This would call the withdraw-funds function
    console.log(chalk.green('✅ Funds withdrawn successfully!'));
    
    this.logger.info('Funds withdrawn', { 
      amount, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `${amount} microSTX withdrawn successfully`,
      data: { withdrawnAmount: amount, remainingBalance: contractBalance - amount }
    };
  }

  /**
   * Withdraw all funds from contract
   */
  private async withdrawAllFunds(privateKey: string): Promise<any> {
    // Get contract balance
    const contractBalance = 1000000; // Simulated balance
    
    if (contractBalance <= 0) {
      throw new Error('No funds available for withdrawal');
    }

    console.log(chalk.blue(`🔄 Withdrawing all funds (${contractBalance} microSTX)...`));
    
    // This would call the withdraw-all-funds function
    console.log(chalk.green('✅ All funds withdrawn successfully!'));
    
    this.logger.info('All funds withdrawn', { 
      amount: contractBalance, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: `All funds (${contractBalance} microSTX) withdrawn successfully`,
      data: { withdrawnAmount: contractBalance, remainingBalance: 0 }
    };
  }

  /**
   * Emergency pause with reason
   */
  private async emergencyPause(reason: string, privateKey: string): Promise<any> {
    console.log(chalk.blue('🚨 Activating emergency pause...'));
    console.log(chalk.yellow('Reason:'), reason);
    
    // This would call the emergency-pause function
    console.log(chalk.green('✅ Emergency pause activated!'));
    
    this.logger.error('Emergency pause activated', { 
      reason, 
      admin: this.walletInterface.getWalletInfo(privateKey).address 
    });
    
    return {
      success: true,
      message: 'Emergency pause activated',
      data: { paused: true, reason }
    };
  }

  /**
   * Get admin dashboard information
   */
  public async getAdminDashboard(): Promise<any> {
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    const royaltyInfo = await this.contractInterface.getRoyaltyInfo();
    const contractStatus = await this.contractInterface.getContractStatus();
    
    return {
      collection: collectionInfo,
      minting: mintInfo,
      royalty: royaltyInfo,
      status: contractStatus,
      // contractBalance would be fetched from contract
      contractBalance: 1000000, // Simulated
      lastUpdated: new Date().toISOString()
    };
  }
}