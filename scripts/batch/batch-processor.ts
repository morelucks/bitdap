/**
 * Batch Processor
 * Handles batch operations for multiple token interactions
 */

import { readFileSync, writeFileSync } from 'fs';
import { BatchOperation, BatchResult, TransactionResult } from '../config/types.js';
import { ContractInterface } from '../contract/contract-interface.js';
import { WalletInterface } from '../wallet/wallet-interface.js';
import { Logger } from '../logging/logger.js';
import { ErrorHandler } from '../error/error-handler.js';
import chalk from 'chalk';

export class BatchProcessor {
  private contractInterface: ContractInterface;
  private walletInterface: WalletInterface;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private rateLimitDelay: number = 1000; // 1 second between operations

  constructor() {
    this.contractInterface = new ContractInterface();
    this.walletInterface = new WalletInterface();
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Process batch operations from file
   */
  public async processBatchFile(filePath: string, privateKey: string): Promise<BatchResult> {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      let operations: BatchOperation[];

      // Parse file based on extension
      if (filePath.endsWith('.json')) {
        operations = this.parseJSONBatch(fileContent);
      } else if (filePath.endsWith('.csv')) {
        operations = this.parseCSVBatch(fileContent);
      } else {
        throw new Error('Unsupported file format. Use .json or .csv files.');
      }

      return await this.processBatchOperations(operations, privateKey);

    } catch (error: any) {
      this.logger.error('Batch file processing failed', { filePath, error: error.message });
      throw new Error(`Failed to process batch file: ${error.message}`);
    }
  }

  /**
   * Process array of batch operations
   */
  public async processBatchOperations(operations: BatchOperation[], privateKey: string): Promise<BatchResult> {
    const startTime = Date.now();
    const result: BatchResult = {
      totalOperations: operations.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      operations: [],
      executionTime: 0
    };

    this.logger.info(`Starting batch processing of ${operations.length} operations`);

    // Validate private key
    if (!this.walletInterface.validatePrivateKey(privateKey)) {
      throw new Error('Invalid private key provided for batch operations');
    }

    const walletInfo = this.walletInterface.getWalletInfo(privateKey);
    console.log(chalk.blue('👤 Batch Wallet:'), walletInfo.address);
    console.log(chalk.blue('📦 Operations:'), operations.length);

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      console.log(chalk.blue(`\n🔄 Processing operation ${i + 1}/${operations.length}: ${operation.command}`));

      try {
        // Validate operation
        this.validateOperation(operation);

        // Execute operation
        const operationResult = await this.executeOperation(operation, privateKey);
        
        operation.status = operationResult.success ? 'success' : 'failed';
        operation.result = operationResult;

        if (operationResult.success) {
          result.successful++;
          console.log(chalk.green('✅ Success'));
        } else {
          result.failed++;
          console.log(chalk.red('❌ Failed:'), operationResult.error?.message);
        }

      } catch (error: any) {
        operation.status = 'failed';
        operation.error = error.message;
        result.failed++;
        
        this.logger.error(`Batch operation ${i + 1} failed`, { 
          operation: operation.command, 
          error: error.message 
        });
        
        console.log(chalk.red('❌ Failed:'), error.message);
      }

      result.operations.push(operation);

      // Rate limiting - wait between operations
      if (i < operations.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    result.executionTime = Date.now() - startTime;

    this.logger.logBatchOperation('batch-process', operations.length, result);
    this.displayBatchSummary(result);

    return result;
  }

  /**
   * Parse JSON batch file
   */
  private parseJSONBatch(content: string): BatchOperation[] {
    try {
      const data = JSON.parse(content);
      
      if (!Array.isArray(data.operations)) {
        throw new Error('JSON file must contain an "operations" array');
      }

      return data.operations.map((op: any, index: number) => ({
        id: op.id || `op-${index + 1}`,
        command: op.command,
        parameters: op.parameters || {},
        status: 'pending'
      }));

    } catch (error: any) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Parse CSV batch file
   */
  private parseCSVBatch(content: string): BatchOperation[] {
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const operations: BatchOperation[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const operation: BatchOperation = {
        id: `csv-${i}`,
        command: '',
        parameters: {},
        status: 'pending'
      };

      headers.forEach((header, index) => {
        if (header === 'command') {
          operation.command = values[index];
        } else {
          operation.parameters[header] = values[index];
        }
      });

      if (!operation.command) {
        throw new Error(`Row ${i + 1}: Missing command`);
      }

      operations.push(operation);
    }

    return operations;
  }

  /**
   * Validate batch operation
   */
  private validateOperation(operation: BatchOperation): void {
    if (!operation.command) {
      throw new Error('Operation must have a command');
    }

    const supportedCommands = ['mint', 'transfer', 'burn'];
    if (!supportedCommands.includes(operation.command)) {
      throw new Error(`Unsupported command: ${operation.command}. Supported: ${supportedCommands.join(', ')}`);
    }

    // Command-specific validation
    switch (operation.command) {
      case 'mint':
        if (!operation.parameters.tier) {
          throw new Error('Mint operation requires tier parameter');
        }
        break;
      
      case 'transfer':
        if (!operation.parameters['token-id'] || !operation.parameters.recipient) {
          throw new Error('Transfer operation requires token-id and recipient parameters');
        }
        break;
      
      case 'burn':
        if (!operation.parameters['token-id']) {
          throw new Error('Burn operation requires token-id parameter');
        }
        break;
    }
  }

  /**
   * Execute single batch operation
   */
  private async executeOperation(operation: BatchOperation, privateKey: string): Promise<TransactionResult> {
    switch (operation.command) {
      case 'mint':
        return await this.contractInterface.mintPass(
          parseInt(operation.parameters.tier),
          operation.parameters.uri || null,
          privateKey
        );
      
      case 'transfer':
        return await this.contractInterface.transferToken(
          parseInt(operation.parameters['token-id']),
          operation.parameters.recipient,
          privateKey
        );
      
      case 'burn':
        return await this.contractInterface.burnToken(
          parseInt(operation.parameters['token-id']),
          privateKey
        );
      
      default:
        throw new Error(`Unknown command: ${operation.command}`);
    }
  }

  /**
   * Display batch operation summary
   */
  private displayBatchSummary(result: BatchResult): void {
    console.log(chalk.blue('\n📊 Batch Operation Summary:'));
    console.log(`  Total Operations: ${result.totalOperations}`);
    console.log(chalk.green(`  Successful: ${result.successful}`));
    console.log(chalk.red(`  Failed: ${result.failed}`));
    console.log(chalk.yellow(`  Skipped: ${result.skipped}`));
    console.log(`  Execution Time: ${result.executionTime}ms`);
    
    const successRate = (result.successful / result.totalOperations * 100).toFixed(2);
    console.log(`  Success Rate: ${successRate}%`);

    if (result.failed > 0) {
      console.log(chalk.red('\n❌ Failed Operations:'));
      result.operations
        .filter(op => op.status === 'failed')
        .forEach(op => {
          console.log(chalk.red(`  - ${op.id}: ${op.error || 'Unknown error'}`));
        });
    }
  }

  /**
   * Save batch results to file
   */
  public saveBatchResults(result: BatchResult, outputPath: string): void {
    try {
      const output = {
        summary: {
          totalOperations: result.totalOperations,
          successful: result.successful,
          failed: result.failed,
          skipped: result.skipped,
          executionTime: result.executionTime,
          timestamp: new Date().toISOString()
        },
        operations: result.operations
      };

      writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(chalk.blue('💾 Results saved to:'), outputPath);

    } catch (error: any) {
      this.logger.error('Failed to save batch results', { outputPath, error: error.message });
      console.log(chalk.red('❌ Failed to save results:'), error.message);
    }
  }

  /**
   * Create sample batch files
   */
  public createSampleBatchFiles(): void {
    // Sample JSON batch file
    const jsonSample = {
      operations: [
        {
          id: "mint-basic-1",
          command: "mint",
          parameters: {
            tier: 1,
            uri: "https://example.com/metadata/1.json"
          }
        },
        {
          id: "mint-pro-1",
          command: "mint",
          parameters: {
            tier: 2
          }
        },
        {
          id: "transfer-1",
          command: "transfer",
          parameters: {
            "token-id": 1,
            recipient: "ST1RECIPIENT..."
          }
        }
      ]
    };

    writeFileSync('batch-sample.json', JSON.stringify(jsonSample, null, 2));

    // Sample CSV batch file
    const csvSample = `command,tier,token-id,recipient,uri
mint,1,,,"https://example.com/metadata/1.json"
mint,2,,,
transfer,,1,ST1RECIPIENT...,`;

    writeFileSync('batch-sample.csv', csvSample);

    console.log(chalk.green('✅ Sample batch files created:'));
    console.log('  - batch-sample.json');
    console.log('  - batch-sample.csv');
  }

  /**
   * Set rate limiting delay
   */
  public setRateLimitDelay(delayMs: number): void {
    this.rateLimitDelay = Math.max(100, delayMs); // Minimum 100ms
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}