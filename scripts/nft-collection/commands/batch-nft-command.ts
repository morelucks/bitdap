/**
 * NFT Batch Command
 * Handles batch operations for NFT collection
 */

import { CommandDefinition } from '../../config/types.js';
import { NFTContractInterface } from '../nft-contract-interface.js';
import { WalletInterface } from '../../wallet/wallet-interface.js';
import { Logger } from '../../logging/logger.js';
import { 
  NFTBatchMintRequest, 
  NFTBatchTransferRequest, 
  NFTBatchBurnRequest,
  BatchOperationResult,
  NFTOperationResult 
} from '../types.js';
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

export class BatchNFTCommand {
  private contractInterface: NFTContractInterface;
  private walletInterface: WalletInterface;
  private logger: Logger;
  private rateLimitDelay: number = 1500; // 1.5 seconds between operations

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
      name: 'nft-batch',
      description: 'Execute batch operations for NFT collection',
      aliases: ['batch-nft', 'nbatch'],
      parameters: [
        {
          name: 'operation',
          type: 'string',
          required: true,
          description: 'Batch operation type: mint, transfer, burn'
        },
        {
          name: 'file',
          type: 'string',
          required: false,
          description: 'Path to batch file (JSON or CSV format)'
        },
        {
          name: 'private-key',
          type: 'string',
          required: true,
          description: 'Private key for signing transactions'
        },
        {
          name: 'output',
          type: 'string',
          required: false,
          description: 'Output file path for results'
        },
        {
          name: 'delay',
          type: 'number',
          required: false,
          description: 'Delay between operations in milliseconds (default: 1500)'
        },
        {
          name: 'create-sample',
          type: 'boolean',
          required: false,
          description: 'Create sample batch files'
        },
        {
          name: 'recipients',
          type: 'string',
          required: false,
          description: 'Comma-separated list of recipient addresses (for simple batch mint)'
        },
        {
          name: 'token-ids',
          type: 'string',
          required: false,
          description: 'Comma-separated list of token IDs (for batch operations)'
        },
        {
          name: 'base-uri',
          type: 'string',
          required: false,
          description: 'Base URI for batch minting (will append token numbers)'
        }
      ],
      examples: [
        'npm run token-interact nft-batch --operation mint --file mint-batch.json --private-key YOUR_KEY',
        'npm run token-interact nft-batch --operation transfer --file transfer-batch.csv --private-key YOUR_KEY',
        'npm run token-interact batch-nft --operation burn --token-ids "1,2,3,4,5" --private-key YOUR_KEY',
        'npm run token-interact nbatch --operation mint --recipients "ST1ADDR1...,ST1ADDR2..." --base-uri "https://example.com/metadata/" --private-key YOUR_KEY',
        'npm run token-interact nft-batch --create-sample'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the batch command
   */
  public async execute(args: any): Promise<any> {
    const { 
      operation,
      file,
      'private-key': privateKey,
      output,
      delay,
      'create-sample': createSample,
      recipients,
      'token-ids': tokenIds,
      'base-uri': baseUri
    } = args;

    try {
      // Handle sample file creation
      if (createSample) {
        this.createSampleBatchFiles();
        return {
          success: true,
          message: 'Sample batch files created successfully',
          data: {
            files: ['nft-mint-batch.json', 'nft-transfer-batch.json', 'nft-burn-batch.csv']
          }
        };
      }

      // Validate required parameters
      if (!operation) {
        throw new Error('Operation parameter is required');
      }

      if (!privateKey) {
        throw new Error('Private key is required for batch operations');
      }

      // Validate private key
      if (!this.walletInterface.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Set rate limiting delay if specified
      if (delay) {
        this.rateLimitDelay = Math.max(500, delay); // Minimum 500ms
        console.log(chalk.blue('⏱️  Rate limit delay:'), `${this.rateLimitDelay}ms`);
      }

      // Get wallet info
      const walletInfo = this.walletInterface.getWalletInfo(privateKey);
      console.log(chalk.blue('👤 Batch Operator:'), walletInfo.address);
      console.log(chalk.blue('🔄 Operation:'), operation);

      // Execute based on operation type
      switch (operation.toLowerCase()) {
        case 'mint':
          return await this.executeBatchMint(file, recipients, baseUri, privateKey, output);
        
        case 'transfer':
          return await this.executeBatchTransfer(file, privateKey, output);
        
        case 'burn':
          return await this.executeBatchBurn(file, tokenIds, privateKey, output);
        
        default:
          throw new Error(`Unknown operation: ${operation}. Supported operations: mint, transfer, burn`);
      }

    } catch (error: any) {
      this.logger.error('NFT batch command failed', {
        operation,
        file,
        error: error.message
      });
      
      console.log(chalk.red('❌ Batch operation failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'BATCH_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Batch operation failed'
      };
    }
  }

  /**
   * Execute batch mint operation
   */
  private async executeBatchMint(
    file: string | undefined,
    recipients: string | undefined,
    baseUri: string | undefined,
    privateKey: string,
    outputFile: string | undefined
  ): Promise<BatchOperationResult> {
    let mintRequests: Array<{ recipient: string; uri?: string }> = [];

    if (file) {
      // Load from file
      mintRequests = this.loadBatchMintFromFile(file);
    } else if (recipients) {
      // Parse recipients from command line
      const recipientList = recipients.split(',').map(addr => addr.trim());
      mintRequests = recipientList.map((recipient, index) => ({
        recipient,
        uri: baseUri ? `${baseUri}${index + 1}.json` : undefined
      }));
    } else {
      throw new Error('Either file or recipients parameter is required for batch mint');
    }

    console.log(chalk.blue('📦 Batch Mint Operations:'), mintRequests.length);

    const startTime = Date.now();
    const results: NFTOperationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < mintRequests.length; i++) {
      const request = mintRequests[i];
      console.log(chalk.blue(`\n🔄 Minting NFT ${i + 1}/${mintRequests.length} for ${request.recipient}...`));

      try {
        // Validate recipient address
        if (!this.walletInterface.validateAddress(request.recipient)) {
          throw new Error(`Invalid recipient address: ${request.recipient}`);
        }

        const result = await this.contractInterface.mintNFT(
          request.recipient,
          request.uri || null,
          privateKey
        );

        results.push(result);

        if (result.success) {
          successCount++;
          console.log(chalk.green(`✅ Success: ${result.txId}`));
        } else {
          failCount++;
          console.log(chalk.red(`❌ Failed: ${result.error?.message}`));
        }

      } catch (error: any) {
        failCount++;
        const errorResult: NFTOperationResult = {
          success: false,
          error: { code: 500, message: error.message }
        };
        results.push(errorResult);
        console.log(chalk.red(`❌ Failed: ${error.message}`));
      }

      // Rate limiting
      if (i < mintRequests.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const executionTime = Date.now() - startTime;
    const batchResult: BatchOperationResult = {
      totalOperations: mintRequests.length,
      successful: successCount,
      failed: failCount,
      results,
      executionTime
    };

    this.displayBatchSummary('Batch Mint', batchResult);
    
    if (outputFile) {
      this.saveBatchResults(batchResult, outputFile);
    }

    this.logger.info('Batch mint completed', {
      totalOperations: mintRequests.length,
      successful: successCount,
      failed: failCount,
      executionTime
    });

    return batchResult;
  }

  /**
   * Execute batch transfer operation
   */
  private async executeBatchTransfer(
    file: string | undefined,
    privateKey: string,
    outputFile: string | undefined
  ): Promise<BatchOperationResult> {
    if (!file) {
      throw new Error('File parameter is required for batch transfer');
    }

    const transferRequests = this.loadBatchTransferFromFile(file);
    console.log(chalk.blue('📦 Batch Transfer Operations:'), transferRequests.length);

    const startTime = Date.now();
    const results: NFTOperationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Get wallet address for validation
    const walletInfo = this.walletInterface.getWalletInfo(privateKey);

    for (let i = 0; i < transferRequests.length; i++) {
      const request = transferRequests[i];
      console.log(chalk.blue(`\n🔄 Transferring NFT ${request.tokenId} from ${request.from} to ${request.to}...`));

      try {
        // Validate addresses
        if (!this.walletInterface.validateAddress(request.from)) {
          throw new Error(`Invalid sender address: ${request.from}`);
        }
        if (!this.walletInterface.validateAddress(request.to)) {
          throw new Error(`Invalid recipient address: ${request.to}`);
        }

        // Verify wallet matches sender or is approved
        if (request.from !== walletInfo.address) {
          // Check if wallet is approved for this token
          const approved = await this.contractInterface.getApproved(request.tokenId);
          if (approved !== walletInfo.address) {
            throw new Error(`Wallet not authorized to transfer token ${request.tokenId}`);
          }
        }

        const result = await this.contractInterface.transferNFT(
          request.tokenId,
          request.from,
          request.to,
          privateKey
        );

        results.push(result);

        if (result.success) {
          successCount++;
          console.log(chalk.green(`✅ Success: ${result.txId}`));
        } else {
          failCount++;
          console.log(chalk.red(`❌ Failed: ${result.error?.message}`));
        }

      } catch (error: any) {
        failCount++;
        const errorResult: NFTOperationResult = {
          success: false,
          error: { code: 500, message: error.message }
        };
        results.push(errorResult);
        console.log(chalk.red(`❌ Failed: ${error.message}`));
      }

      // Rate limiting
      if (i < transferRequests.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const executionTime = Date.now() - startTime;
    const batchResult: BatchOperationResult = {
      totalOperations: transferRequests.length,
      successful: successCount,
      failed: failCount,
      results,
      executionTime
    };

    this.displayBatchSummary('Batch Transfer', batchResult);
    
    if (outputFile) {
      this.saveBatchResults(batchResult, outputFile);
    }

    return batchResult;
  }

  /**
   * Execute batch burn operation
   */
  private async executeBatchBurn(
    file: string | undefined,
    tokenIds: string | undefined,
    privateKey: string,
    outputFile: string | undefined
  ): Promise<BatchOperationResult> {
    let tokenIdList: number[] = [];

    if (file) {
      // Load from file
      tokenIdList = this.loadBatchBurnFromFile(file);
    } else if (tokenIds) {
      // Parse token IDs from command line
      tokenIdList = tokenIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else {
      throw new Error('Either file or token-ids parameter is required for batch burn');
    }

    console.log(chalk.blue('📦 Batch Burn Operations:'), tokenIdList.length);

    const startTime = Date.now();
    const results: NFTOperationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Get wallet address for validation
    const walletInfo = this.walletInterface.getWalletInfo(privateKey);

    for (let i = 0; i < tokenIdList.length; i++) {
      const tokenId = tokenIdList[i];
      console.log(chalk.blue(`\n🔄 Burning NFT ${tokenId} (${i + 1}/${tokenIdList.length})...`));

      try {
        // Verify ownership
        const owner = await this.contractInterface.getTokenOwner(tokenId);
        if (owner !== walletInfo.address) {
          throw new Error(`You do not own token ${tokenId}. Owner: ${owner}`);
        }

        const result = await this.contractInterface.burnNFT(tokenId, privateKey);
        results.push(result);

        if (result.success) {
          successCount++;
          console.log(chalk.green(`✅ Success: ${result.txId}`));
        } else {
          failCount++;
          console.log(chalk.red(`❌ Failed: ${result.error?.message}`));
        }

      } catch (error: any) {
        failCount++;
        const errorResult: NFTOperationResult = {
          success: false,
          error: { code: 500, message: error.message }
        };
        results.push(errorResult);
        console.log(chalk.red(`❌ Failed: ${error.message}`));
      }

      // Rate limiting
      if (i < tokenIdList.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const executionTime = Date.now() - startTime;
    const batchResult: BatchOperationResult = {
      totalOperations: tokenIdList.length,
      successful: successCount,
      failed: failCount,
      results,
      executionTime
    };

    this.displayBatchSummary('Batch Burn', batchResult);
    
    if (outputFile) {
      this.saveBatchResults(batchResult, outputFile);
    }

    return batchResult;
  }

  /**
   * Load batch mint requests from file
   */
  private loadBatchMintFromFile(filePath: string): Array<{ recipient: string; uri?: string }> {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      
      if (filePath.endsWith('.json')) {
        const data = JSON.parse(fileContent);
        return data.mints || data.operations || data;
      } else if (filePath.endsWith('.csv')) {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const mints: Array<{ recipient: string; uri?: string }> = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const mint: any = {};
          
          headers.forEach((header, index) => {
            mint[header] = values[index];
          });
          
          if (mint.recipient) {
            mints.push({
              recipient: mint.recipient,
              uri: mint.uri || undefined
            });
          }
        }
        
        return mints;
      } else {
        throw new Error('Unsupported file format. Use .json or .csv');
      }
    } catch (error: any) {
      throw new Error(`Failed to load batch mint file: ${error.message}`);
    }
  }

  /**
   * Load batch transfer requests from file
   */
  private loadBatchTransferFromFile(filePath: string): Array<{ tokenId: number; from: string; to: string }> {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      
      if (filePath.endsWith('.json')) {
        const data = JSON.parse(fileContent);
        return data.transfers || data.operations || data;
      } else if (filePath.endsWith('.csv')) {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const transfers: Array<{ tokenId: number; from: string; to: string }> = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const transfer: any = {};
          
          headers.forEach((header, index) => {
            transfer[header] = values[index];
          });
          
          if (transfer.tokenId && transfer.from && transfer.to) {
            transfers.push({
              tokenId: parseInt(transfer.tokenId),
              from: transfer.from,
              to: transfer.to
            });
          }
        }
        
        return transfers;
      } else {
        throw new Error('Unsupported file format. Use .json or .csv');
      }
    } catch (error: any) {
      throw new Error(`Failed to load batch transfer file: ${error.message}`);
    }
  }

  /**
   * Load batch burn requests from file
   */
  private loadBatchBurnFromFile(filePath: string): number[] {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      
      if (filePath.endsWith('.json')) {
        const data = JSON.parse(fileContent);
        return data.tokenIds || data.burns || data;
      } else if (filePath.endsWith('.csv')) {
        const lines = fileContent.trim().split('\n');
        const tokenIds: number[] = [];
        
        // Skip header if present
        const startIndex = lines[0].includes('tokenId') || lines[0].includes('token_id') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const tokenId = parseInt(lines[i].trim());
          if (!isNaN(tokenId)) {
            tokenIds.push(tokenId);
          }
        }
        
        return tokenIds;
      } else {
        throw new Error('Unsupported file format. Use .json or .csv');
      }
    } catch (error: any) {
      throw new Error(`Failed to load batch burn file: ${error.message}`);
    }
  }

  /**
   * Display batch operation summary
   */
  private displayBatchSummary(operationType: string, result: BatchOperationResult): void {
    console.log(chalk.blue(`\n📊 ${operationType} Summary:`));
    console.log(`  Total Operations: ${result.totalOperations}`);
    console.log(chalk.green(`  Successful: ${result.successful}`));
    console.log(chalk.red(`  Failed: ${result.failed}`));
    console.log(`  Execution Time: ${result.executionTime}ms`);
    
    const successRate = (result.successful / result.totalOperations * 100).toFixed(2);
    console.log(`  Success Rate: ${successRate}%`);

    if (result.failed > 0) {
      console.log(chalk.red('\n❌ Failed Operations:'));
      result.results
        .filter(r => !r.success)
        .slice(0, 5) // Show first 5 failures
        .forEach((r, index) => {
          console.log(chalk.red(`  ${index + 1}. ${r.error?.message}`));
        });
      
      if (result.failed > 5) {
        console.log(chalk.red(`  ... and ${result.failed - 5} more failures`));
      }
    }
  }

  /**
   * Save batch results to file
   */
  private saveBatchResults(result: BatchOperationResult, outputPath: string): void {
    try {
      const output = {
        summary: {
          totalOperations: result.totalOperations,
          successful: result.successful,
          failed: result.failed,
          executionTime: result.executionTime,
          successRate: `${(result.successful / result.totalOperations * 100).toFixed(2)}%`,
          timestamp: new Date().toISOString()
        },
        results: result.results
      };

      writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(chalk.blue('💾 Results saved to:'), outputPath);

    } catch (error: any) {
      console.log(chalk.red('❌ Failed to save results:'), error.message);
    }
  }

  /**
   * Create sample batch files
   */
  private createSampleBatchFiles(): void {
    // Sample JSON mint batch file
    const mintSample = {
      mints: [
        {
          recipient: "ST1RECIPIENT1...",
          uri: "https://example.com/metadata/1.json"
        },
        {
          recipient: "ST1RECIPIENT2...",
          uri: "https://example.com/metadata/2.json"
        },
        {
          recipient: "ST1RECIPIENT3...",
          uri: "https://example.com/metadata/3.json"
        }
      ]
    };

    writeFileSync('nft-mint-batch.json', JSON.stringify(mintSample, null, 2));

    // Sample JSON transfer batch file
    const transferSample = {
      transfers: [
        {
          tokenId: 1,
          from: "ST1SENDER...",
          to: "ST1RECIPIENT..."
        },
        {
          tokenId: 2,
          from: "ST1SENDER...",
          to: "ST1RECIPIENT..."
        }
      ]
    };

    writeFileSync('nft-transfer-batch.json', JSON.stringify(transferSample, null, 2));

    // Sample CSV burn batch file
    const burnSample = `tokenId
1
2
3
4
5`;

    writeFileSync('nft-burn-batch.csv', burnSample);

    console.log(chalk.green('✅ Sample batch files created:'));
    console.log('  - nft-mint-batch.json');
    console.log('  - nft-transfer-batch.json');
    console.log('  - nft-burn-batch.csv');
  }

  /**
   * Set rate limiting delay
   */
  public setRateLimitDelay(delayMs: number): void {
    this.rateLimitDelay = Math.max(500, delayMs); // Minimum 500ms
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}