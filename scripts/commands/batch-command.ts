/**
 * Batch Command
 * Handles batch operations for multiple token interactions
 */

import { CommandDefinition } from '../config/types.js';
import { BatchProcessor } from '../batch/batch-processor.js';
import chalk from 'chalk';

export class BatchCommand {
  private batchProcessor: BatchProcessor;

  constructor() {
    this.batchProcessor = new BatchProcessor();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'batch',
      description: 'Execute multiple operations from a batch file',
      aliases: ['b', 'bulk'],
      parameters: [
        {
          name: 'file',
          type: 'string',
          required: true,
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
          description: 'Delay between operations in milliseconds (default: 1000)'
        },
        {
          name: 'create-sample',
          type: 'boolean',
          required: false,
          description: 'Create sample batch files'
        }
      ],
      examples: [
        'npm run token-interact batch --file operations.json --private-key YOUR_KEY',
        'npm run token-interact batch --file operations.csv --private-key YOUR_KEY --output results.json',
        'npm run token-interact batch --create-sample',
        'npm run token-interact b --file batch.json --private-key YOUR_KEY --delay 2000'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the batch command
   */
  public async execute(args: any): Promise<any> {
    const { 
      file, 
      'private-key': privateKey, 
      output, 
      delay,
      'create-sample': createSample 
    } = args;

    try {
      // Handle sample file creation
      if (createSample) {
        this.batchProcessor.createSampleBatchFiles();
        return {
          success: true,
          message: 'Sample batch files created successfully',
          data: {
            files: ['batch-sample.json', 'batch-sample.csv']
          }
        };
      }

      // Validate required parameters
      if (!file) {
        throw new Error('Batch file path is required');
      }

      if (!privateKey) {
        throw new Error('Private key is required for batch operations');
      }

      // Set rate limiting delay if specified
      if (delay) {
        this.batchProcessor.setRateLimitDelay(delay);
        console.log(chalk.blue('⏱️  Rate limit delay:'), `${delay}ms`);
      }

      console.log(chalk.blue('📁 Processing batch file:'), file);

      // Process batch file
      const result = await this.batchProcessor.processBatchFile(file, privateKey);

      // Save results if output path specified
      if (output) {
        this.batchProcessor.saveBatchResults(result, output);
      }

      return {
        success: result.successful > 0,
        message: `Batch processing completed: ${result.successful}/${result.totalOperations} successful`,
        data: {
          summary: {
            total: result.totalOperations,
            successful: result.successful,
            failed: result.failed,
            skipped: result.skipped,
            executionTime: result.executionTime,
            successRate: `${(result.successful / result.totalOperations * 100).toFixed(2)}%`
          },
          operations: result.operations.map(op => ({
            id: op.id,
            command: op.command,
            status: op.status,
            txId: op.result?.txId,
            error: op.error
          }))
        }
      };

    } catch (error: any) {
      console.log(chalk.red('❌ Batch command failed:'), error.message);
      
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
}