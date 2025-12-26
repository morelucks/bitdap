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

    this.router.registerCommand(new MintCommand().getDefinition());
    this.router.registerCommand(new TransferCommand().getDefinition());
    this.router.registerCommand(new QueryCommand().getDefinition());
    this.router.registerCommand(new ConfigCommand().getDefinition());
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
      
      const result = await this.router.executeCommand(commandName, args);
      
      if (result) {
        this.displayResult(result);
      }
      
    } catch (error: any) {
      console.error(chalk.red('❌ Command failed:'), error.message);
      
      // Show suggestions for unknown commands
      if (error.message.includes('Unknown command')) {
        const suggestions = this.router.getCommandSuggestions(commandName);
        if (suggestions.length > 0) {
          console.log(chalk.yellow('💡 Did you mean:'), suggestions.join(', '));
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