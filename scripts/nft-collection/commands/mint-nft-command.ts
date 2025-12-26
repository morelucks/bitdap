/**
 * NFT Mint Command
 * Handles minting operations for the NFT collection
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { WalletInterface } from '../../wallet/wallet-interface.js';
import { Logger } from '../../logging/logger.js';
import { NFTMintRequest, NFTOperationResult } from '../types.js';
import chalk from 'chalk';

export class MintNFTCommand {
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
      name: 'nft-mint',
      description: 'Mint new NFTs in the collection',
      aliases: ['mint-nft', 'nm'],
      parameters: [
        {
          name: 'recipient',
          type: 'address',
          required: true,
          description: 'Recipient address for the NFT'
        },
        {
          name: 'uri',
          type: 'string',
          required: false,
          description: 'Metadata URI for the NFT'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing the transaction'
        },
        {
          name: 'quantity',
          type: 'number',
          required: false,
          description: 'Number of NFTs to mint (default: 1)'
        }
      ],
      examples: [
        'npm run token-interact nft-mint --recipient ST1RECIPIENT... --private-key YOUR_KEY',
        'npm run token-interact nft-mint --recipient ST1RECIPIENT... --uri "https://example.com/metadata.json" --private-key YOUR_KEY',
        'npm run token-interact mint-nft --recipient ST1RECIPIENT... --quantity 3 --private-key YOUR_KEY'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the mint command
   */
  public async execute(args: any): Promise<any> {
    const { 
      recipient, 
      uri, 
      'private-key': privateKey,
      quantity = 1
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
      console.log(chalk.blue('👤 Minter:'), walletInfo.address);
      console.log(chalk.blue('🎯 Recipient:'), recipient);

      // Check contract status
      const contractStatus = await this.contractInterface.getContractStatus();
      if (contractStatus?.paused) {
        throw new Error('Contract is currently paused. Minting is disabled.');
      }

      // Get mint information
      const mintInfo = await this.contractInterface.getMintInfo();
      if (!mintInfo) {
        throw new Error('Failed to retrieve mint information');
      }

      console.log(chalk.blue('💰 Mint Price:'), `${mintInfo.price} microSTX`);
      console.log(chalk.blue('📊 Supply:'), `${mintInfo.currentSupply}/${mintInfo.maxSupply}`);

      if (!mintInfo.mintingEnabled) {
        throw new Error('Minting is currently disabled');
      }

      // Check supply limits
      if (mintInfo.currentSupply + quantity > mintInfo.maxSupply) {
        throw new Error(`Insufficient supply. Only ${mintInfo.maxSupply - mintInfo.currentSupply} NFTs remaining`);
      }

      // Display transaction summary
      const totalCost = mintInfo.price * quantity;
      const summary = this.walletInterface.prepareTransactionSummary(
        'mint',
        { 
          recipient, 
          uri: uri || 'none',
          quantity,
          totalCost: `${totalCost} microSTX`
        }
      );
      console.log(summary);

      // Execute minting
      if (quantity === 1) {
        return await this.executeSingleMint(recipient, uri, privateKey);
      } else {
        return await this.executeMultipleMints(recipient, uri, quantity, privateKey);
      }

    } catch (error: any) {
      this.logger.error('NFT mint command failed', { 
        recipient, 
        uri, 
        quantity,
        error: error.message 
      });
      
      console.log(chalk.red('❌ Mint failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'MINT_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'NFT mint operation failed'
      };
    }
  }

  /**
   * Execute single NFT mint
   */
  private async executeSingleMint(
    recipient: string, 
    uri: string | undefined, 
    privateKey: string
  ): Promise<NFTOperationResult> {
    console.log(chalk.blue('🔄 Minting NFT...'));
    
    const result = await this.contractInterface.mintNFT(
      recipient,
      uri || null,
      privateKey
    );

    if (result.success) {
      console.log(chalk.green('✅ NFT minted successfully!'));
      console.log(chalk.blue('📝 Transaction ID:'), result.txId);
      
      // Get updated collection info
      const collectionInfo = await this.contractInterface.getCollectionInfo();
      
      this.logger.info('NFT minted successfully', {
        recipient,
        uri,
        txId: result.txId,
        newSupply: collectionInfo?.totalSupply
      });

      return {
        success: true,
        txId: result.txId,
        message: 'NFT minted successfully',
        gasUsed: result.gasUsed,
        fee: result.fee
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
  }

  /**
   * Execute multiple NFT mints
   */
  private async executeMultipleMints(
    recipient: string,
    uri: string | undefined,
    quantity: number,
    privateKey: string
  ): Promise<NFTOperationResult> {
    console.log(chalk.blue(`🔄 Minting ${quantity} NFTs...`));
    
    const results: any[] = [];
    const tokenIds: number[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < quantity; i++) {
      console.log(chalk.blue(`Minting NFT ${i + 1}/${quantity}...`));
      
      try {
        const result = await this.contractInterface.mintNFT(
          recipient,
          uri ? `${uri}#${i + 1}` : null,
          privateKey
        );

        results.push(result);

        if (result.success) {
          successCount++;
          console.log(chalk.green(`✅ NFT ${i + 1} minted: ${result.txId}`));
        } else {
          failCount++;
          console.log(chalk.red(`❌ NFT ${i + 1} failed: ${result.error?.message}`));
        }

        // Rate limiting between mints
        if (i < quantity - 1) {
          await this.delay(1000); // 1 second delay
        }

      } catch (error: any) {
        failCount++;
        console.log(chalk.red(`❌ NFT ${i + 1} failed: ${error.message}`));
        results.push({
          success: false,
          error: { message: error.message }
        });
      }
    }

    console.log(chalk.blue('\n📊 Batch Mint Summary:'));
    console.log(`  Total: ${quantity}`);
    console.log(chalk.green(`  Successful: ${successCount}`));
    console.log(chalk.red(`  Failed: ${failCount}`));

    this.logger.info('Batch mint completed', {
      recipient,
      quantity,
      successCount,
      failCount
    });

    return {
      success: successCount > 0,
      tokenIds,
      message: `Batch mint completed: ${successCount}/${quantity} successful`,
      gasUsed: results.reduce((sum, r) => sum + (r.gasUsed || 0), 0),
      fee: results.reduce((sum, r) => sum + (r.fee || 0), 0)
    };
  }

  /**
   * Validate mint parameters
   */
  private async validateMintParameters(
    recipient: string,
    uri: string | undefined,
    quantity: number
  ): Promise<void> {
    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      throw new Error('Quantity must be between 1 and 10');
    }

    // Validate URI format if provided
    if (uri) {
      try {
        new URL(uri);
      } catch {
        throw new Error('Invalid URI format');
      }
    }

    // Check if recipient can receive more NFTs
    const mintInfo = await this.contractInterface.getMintInfo();
    if (mintInfo && quantity > mintInfo.perAddressLimit) {
      throw new Error(`Quantity exceeds per-address limit of ${mintInfo.perAddressLimit}`);
    }
  }

  /**
   * Get mint cost estimation
   */
  public async getMintCostEstimation(quantity: number): Promise<{
    mintCost: number;
    gasCost: number;
    totalCost: number;
  }> {
    const mintInfo = await this.contractInterface.getMintInfo();
    const mintCost = mintInfo ? mintInfo.price * quantity : 0;
    const gasCost = 1000 * quantity; // Estimated gas cost per mint
    
    return {
      mintCost,
      gasCost,
      totalCost: mintCost + gasCost
    };
  }

  /**
   * Check mint eligibility
   */
  public async checkMintEligibility(
    recipient: string,
    quantity: number
  ): Promise<{
    eligible: boolean;
    reason?: string;
    maxAllowed?: number;
  }> {
    try {
      const mintInfo = await this.contractInterface.getMintInfo();
      const contractStatus = await this.contractInterface.getContractStatus();

      if (!mintInfo || !contractStatus) {
        return { eligible: false, reason: 'Unable to fetch contract information' };
      }

      if (contractStatus.paused) {
        return { eligible: false, reason: 'Contract is paused' };
      }

      if (!mintInfo.mintingEnabled) {
        return { eligible: false, reason: 'Minting is disabled' };
      }

      if (mintInfo.currentSupply + quantity > mintInfo.maxSupply) {
        const remaining = mintInfo.maxSupply - mintInfo.currentSupply;
        return { 
          eligible: false, 
          reason: 'Insufficient supply', 
          maxAllowed: remaining 
        };
      }

      if (quantity > mintInfo.perAddressLimit) {
        return { 
          eligible: false, 
          reason: 'Exceeds per-address limit', 
          maxAllowed: mintInfo.perAddressLimit 
        };
      }

      return { eligible: true };

    } catch (error) {
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}