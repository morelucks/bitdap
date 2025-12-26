/**
 * CLI Interface
 * Handles command-line argument parsing and user interaction
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { CommandRouter } from './command-router.js';
import { ConfigManager } from '../config/config-manager.js';

export class CLIInterface {
  private router: CommandRouter;
  private configManager: ConfigManager;

  constructor() {
    this.router = new CommandRouter();
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Initialize the CLI with all commands
   */
  public async initialize(): Promise<void> {
    // Register all commands
    await this.registerCommands();
    
    // Set up yargs
    this.setupYargs();
  }

  /**
   * Register all available commands
   */
  private async registerCommands(): Promise<void> {
    // Import and register command modules
    const { MintCommand } = await import('../commands/mint-command.js');
    const { TransferCommand } = await import('../commands/transfer-command.js');
    const { QueryCommand } = await import('../commands/query-command.js');
    const { ConfigCommand } = await import('../commands/config-command.js');
    const { BatchCommand } = await import('../commands/batch-command.js');

    // Import NFT collection integration
    const { NFTCLIIntegration } = await import('../nft-collection/nft-cli-integration.js');

    this.router.registerCommand(new MintCommand().getDefinition());
    this.router.registerCommand(new TransferCommand().getDefinition());
    this.router.registerCommand(new QueryCommand().getDefinition());
    this.router.registerCommand(new ConfigCommand().getDefinition());
    this.router.registerCommand(new BatchCommand().getDefinition());

    // Initialize NFT collection commands
    const nftIntegration = new NFTCLIIntegration(this.router);
    
    // Store NFT integration for later use
    (this as any).nftIntegration = nftIntegration;
  }

  /**
   * Set up yargs configuration
   */
  private setupYargs(): void {
    yargs(hideBin(process.argv))
      .scriptName('bitdap-token')
      .usage('Usage: $0 <command> [options]')
      .help('help')
      .alias('help', 'h')
      .version('1.0.0')
      .alias('version', 'v')
      .demandCommand(1, 'You need to specify a command')
      .recommendCommands()
      .strict()
      .command('mint', 'Mint a new Bitdap Pass NFT', (yargs) => {
        return yargs
          .option('tier', {
            type: 'number',
            describe: 'Tier of the pass (1=Basic, 2=Pro, 3=VIP)',
            demandOption: true,
            choices: [1, 2, 3]
          })
          .option('uri', {
            type: 'string',
            describe: 'Optional metadata URI for the token'
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction',
            demandOption: true
          });
      }, async (argv) => {
        await this.executeCommand('mint', argv);
      })
      .command('transfer', 'Transfer a token to another address', (yargs) => {
        return yargs
          .option('token-id', {
            type: 'number',
            describe: 'ID of the token to transfer',
            demandOption: true
          })
          .option('recipient', {
            type: 'string',
            describe: 'Recipient Stacks address',
            demandOption: true
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction',
            demandOption: true
          });
      }, async (argv) => {
        await this.executeCommand('transfer', argv);
      })
      .command('query', 'Query contract information', (yargs) => {
        return yargs
          .option('type', {
            type: 'string',
            describe: 'Type of query to perform',
            choices: ['token', 'supply', 'counters', 'owner'],
            demandOption: true
          })
          .option('token-id', {
            type: 'number',
            describe: 'Token ID (required for token and owner queries)'
          })
          .option('tier', {
            type: 'number',
            describe: 'Tier number (required for tier supply queries)',
            choices: [1, 2, 3]
          });
      }, async (argv) => {
        await this.executeCommand('query', argv);
      })
      .command('nft-mint', 'Mint new NFTs in the collection', (yargs) => {
        return yargs
          .option('recipient', {
            type: 'string',
            describe: 'Recipient address for the NFT',
            demandOption: true
          })
          .option('uri', {
            type: 'string',
            describe: 'Metadata URI for the NFT'
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction',
            demandOption: true
          })
          .option('quantity', {
            type: 'number',
            describe: 'Number of NFTs to mint (default: 1)',
            default: 1
          });
      }, async (argv) => {
        await this.executeCommand('nft-mint', argv);
      })
      .command('nft-transfer', 'Transfer NFTs to another address', (yargs) => {
        return yargs
          .option('token-id', {
            type: 'number',
            describe: 'ID of the NFT to transfer',
            demandOption: true
          })
          .option('from', {
            type: 'string',
            describe: 'Current owner address',
            demandOption: true
          })
          .option('to', {
            type: 'string',
            describe: 'Recipient address',
            demandOption: true
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction',
            demandOption: true
          })
          .option('memo', {
            type: 'string',
            describe: 'Optional memo for the transfer'
          });
      }, async (argv) => {
        await this.executeCommand('nft-transfer', argv);
      })
      .command('nft-approve', 'Approve operators for NFT transfers', (yargs) => {
        return yargs
          .option('action', {
            type: 'string',
            describe: 'Approval action: approve, approve-all, revoke, revoke-all',
            demandOption: true,
            choices: ['approve', 'approve-all', 'revoke', 'revoke-all']
          })
          .option('token-id', {
            type: 'number',
            describe: 'ID of the NFT to approve (required for approve/revoke)'
          })
          .option('operator', {
            type: 'string',
            describe: 'Address to approve as operator',
            demandOption: true
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction',
            demandOption: true
          });
      }, async (argv) => {
        await this.executeCommand('nft-approve', argv);
      })
      .command('nft-query', 'Query NFT collection information', (yargs) => {
        return yargs
          .option('type', {
            type: 'string',
            describe: 'Type of query to perform',
            demandOption: true,
            choices: ['collection', 'token', 'owner', 'mint-info', 'status', 'royalty', 'approved', 'exists', 'supply', 'metadata']
          })
          .option('token-id', {
            type: 'number',
            describe: 'Token ID (required for token-specific queries)'
          })
          .option('owner', {
            type: 'string',
            describe: 'Owner address (for ownership queries)'
          })
          .option('limit', {
            type: 'number',
            describe: 'Maximum number of results to return',
            default: 10
          })
          .option('offset', {
            type: 'number',
            describe: 'Number of results to skip',
            default: 0
          });
      }, async (argv) => {
        await this.executeCommand('nft-query', argv);
      })
      .command('nft-admin', 'Administrative operations for NFT collection', (yargs) => {
        return yargs
          .option('action', {
            type: 'string',
            describe: 'Administrative action to perform',
            demandOption: true,
            choices: ['pause', 'unpause', 'set-mint-price', 'set-per-address-limit', 'set-max-supply', 'enable-minting', 'disable-minting', 'set-royalty', 'set-metadata', 'transfer-ownership', 'withdraw', 'withdraw-all', 'emergency-pause']
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing the transaction (must be contract owner)',
            demandOption: true
          })
          .option('value', {
            type: 'string',
            describe: 'Value for the action (varies by action type)'
          })
          .option('recipient', {
            type: 'string',
            describe: 'Recipient address (for ownership transfer, royalty setup)'
          })
          .option('amount', {
            type: 'number',
            describe: 'Amount (for price setting, royalty percentage, withdrawal)'
          })
          .option('name', {
            type: 'string',
            describe: 'Collection name (for metadata updates)'
          })
          .option('symbol', {
            type: 'string',
            describe: 'Collection symbol (for metadata updates)'
          })
          .option('description', {
            type: 'string',
            describe: 'Collection description (for metadata updates)'
          })
          .option('uri', {
            type: 'string',
            describe: 'Collection URI (for metadata updates)'
          });
      }, async (argv) => {
        await this.executeCommand('nft-admin', argv);
      })
      .command('nft-batch', 'Execute batch operations for NFT collection', (yargs) => {
        return yargs
          .option('operation', {
            type: 'string',
            describe: 'Batch operation type: mint, transfer, burn',
            demandOption: true,
            choices: ['mint', 'transfer', 'burn']
          })
          .option('file', {
            type: 'string',
            describe: 'Path to batch file (JSON or CSV format)'
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing transactions',
            demandOption: true
          })
          .option('output', {
            type: 'string',
            describe: 'Output file path for results'
          })
          .option('delay', {
            type: 'number',
            describe: 'Delay between operations in milliseconds',
            default: 1500
          })
          .option('create-sample', {
            type: 'boolean',
            describe: 'Create sample batch files'
          })
          .option('recipients', {
            type: 'string',
            describe: 'Comma-separated list of recipient addresses (for simple batch mint)'
          })
          .option('token-ids', {
            type: 'string',
            describe: 'Comma-separated list of token IDs (for batch operations)'
          })
          .option('base-uri', {
            type: 'string',
            describe: 'Base URI for batch minting (will append token numbers)'
          });
      }, async (argv) => {
        await this.executeCommand('nft-batch', argv);
      })
      .command('batch', 'Execute multiple operations from a batch file', (yargs) => {
        return yargs
          .option('file', {
            type: 'string',
            describe: 'Path to batch file (JSON or CSV format)',
            demandOption: true
          })
          .option('private-key', {
            type: 'string',
            describe: 'Private key for signing transactions',
            demandOption: true
          })
          .option('output', {
            type: 'string',
            describe: 'Output file path for results'
          })
          .option('delay', {
            type: 'number',
            describe: 'Delay between operations in milliseconds',
            default: 1000
          })
          .option('create-sample', {
            type: 'boolean',
            describe: 'Create sample batch files'
          });
      }, async (argv) => {
        await this.executeCommand('batch', argv);
      })
      .command('config', 'Manage configuration settings', (yargs) => {
        return yargs
          .option('action', {
            type: 'string',
            describe: 'Configuration action',
            choices: ['show', 'set', 'reset'],
            demandOption: true
          })
          .option('network', {
            type: 'string',
            describe: 'Network type',
            choices: ['mainnet', 'testnet', 'local']
          })
          .option('contract-address', {
            type: 'string',
            describe: 'Contract address'
          })
          .option('output-format', {
            type: 'string',
            describe: 'Output format',
            choices: ['json', 'table', 'csv']
          });
      }, async (argv) => {
        await this.executeCommand('config', argv);
      })
      .fail((msg, err, yargs) => {
        if (err) {
          console.error(chalk.red('❌ Error:'), err.message);
        } else {
          console.error(chalk.red('❌ Error:'), msg);
          console.log('\n' + yargs.help());
        }
        process.exit(1);
      })
      .parse();
  }

  /**
   * Execute a command through the router
   */
  private async executeCommand(commandName: string, args: any): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Executing command:'), commandName);
      
      // Check if it's an NFT command and use enhanced handling
      const nftIntegration = (this as any).nftIntegration;
      if (nftIntegration && nftIntegration.isNFTCommand(commandName)) {
        const result = await nftIntegration.executeNFTCommand(commandName, args);
        if (result) {
          this.displayResult(result);
        }
      } else {
        const result = await this.router.executeCommand(commandName, args);
        if (result) {
          this.displayResult(result);
        }
      }
      
    } catch (error: any) {
      console.error(chalk.red('❌ Command failed:'), error.message);
      
      // Show suggestions for unknown commands
      if (error.message.includes('Unknown command')) {
        const suggestions = this.router.getCommandSuggestions(commandName);
        const nftIntegration = (this as any).nftIntegration;
        
        // Add NFT command suggestions if available
        if (nftIntegration) {
          const nftSuggestions = nftIntegration.getNFTCommandSuggestions(commandName);
          suggestions.push(...nftSuggestions);
        }
        
        if (suggestions.length > 0) {
          console.log(chalk.yellow('💡 Did you mean:'), suggestions.slice(0, 5).join(', '));
        }
      }
      
      process.exit(1);
    }
  }

  /**
   * Display command result based on output format
   */
  private displayResult(result: any): void {
    const config = this.configManager.getConfig();
    
    switch (config.output.format) {
      case 'json':
        console.log(JSON.stringify(result, null, 2));
        break;
      case 'table':
        this.displayTableResult(result);
        break;
      case 'csv':
        this.displayCSVResult(result);
        break;
    }
  }

  /**
   * Display result in table format
   */
  private displayTableResult(result: any): void {
    if (result.success) {
      console.log(chalk.green('✅ Success!'));
      if (result.txId) {
        console.log(chalk.blue('Transaction ID:'), result.txId);
      }
      if (result.data) {
        console.table(result.data);
      }
    } else {
      console.log(chalk.red('❌ Failed!'));
      if (result.error) {
        console.log(chalk.red('Error:'), result.error.message);
        if (result.error.suggestion) {
          console.log(chalk.yellow('💡 Suggestion:'), result.error.suggestion);
        }
      }
    }
  }

  /**
   * Display result in CSV format
   */
  private displayCSVResult(result: any): void {
    // Simple CSV output for now
    if (result.data && Array.isArray(result.data)) {
      const headers = Object.keys(result.data[0] || {});
      console.log(headers.join(','));
      result.data.forEach((row: any) => {
        console.log(headers.map(h => row[h] || '').join(','));
      });
    } else {
      console.log('success,message');
      console.log(`${result.success || false},"${result.message || ''}"`);
    }
  }

  /**
   * Start the CLI application
   */
  public async start(): Promise<void> {
    try {
      await this.initialize();
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to initialize CLI:'), error.message);
      process.exit(1);
    }
  }
}