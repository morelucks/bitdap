/**
 * Config Command
 * Handles configuration management and settings
 */

import { CommandDefinition } from '../config/types.js';
import { ConfigManager } from '../config/config-manager.js';
import chalk from 'chalk';

export class ConfigCommand {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'config',
      description: 'Manage configuration settings',
      aliases: ['cfg', 'settings'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Configuration action (show, set, reset)'
        },
        {
          name: 'network',
          type: 'string',
          required: false,
          description: 'Network type (mainnet, testnet, local)'
        },
        {
          name: 'contract-address',
          type: 'string',
          required: false,
          description: 'Contract address'
        },
        {
          name: 'node-url',
          type: 'string',
          required: false,
          description: 'Stacks node URL'
        },
        {
          name: 'output-format',
          type: 'string',
          required: false,
          description: 'Output format (json, table, csv)'
        },
        {
          name: 'log-level',
          type: 'string',
          required: false,
          description: 'Logging level (debug, info, warn, error)'
        },
        {
          name: 'colors',
          type: 'boolean',
          required: false,
          description: 'Enable colored output'
        },
        {
          name: 'verbose',
          type: 'boolean',
          required: false,
          description: 'Enable verbose output'
        }
      ],
      examples: [
        'npm run token-interact config --action show',
        'npm run token-interact config --action set --network mainnet',
        'npm run token-interact config --action set --output-format json',
        'npm run token-interact config --action set --contract-address SP1234...',
        'npm run token-interact config --action reset'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the config command
   */
  public async execute(args: any): Promise<any> {
    const { action } = args;

    try {
      console.log(chalk.blue('⚙️  Configuration action:'), action);

      let result: any;

      switch (action.toLowerCase()) {
        case 'show':
        case 'display':
        case 'get':
          result = await this.showConfig();
          break;

        case 'set':
        case 'update':
          result = await this.setConfig(args);
          break;

        case 'reset':
        case 'default':
          result = await this.resetConfig();
          break;

        case 'validate':
        case 'check':
          result = await this.validateConfig();
          break;

        case 'export':
          result = await this.exportConfig();
          break;

        default:
          throw new Error(`Unknown config action: ${action}. Available actions: show, set, reset, validate, export`);
      }

      return {
        success: true,
        data: result,
        message: `Configuration ${action} completed successfully`
      };

    } catch (error: any) {
      console.log(chalk.red('❌ Config command failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Configuration operation failed'
      };
    }
  }

  /**
   * Show current configuration
   */
  private async showConfig(): Promise<any> {
    const config = this.configManager.getConfig();
    
    console.log(chalk.green('📋 Current Configuration:'));
    console.log('');
    
    console.log(chalk.blue('🌐 Network Settings:'));
    console.log(`  Type: ${config.network.type}`);
    console.log(`  Node URL: ${config.network.nodeUrl}`);
    console.log(`  Contract Address: ${config.network.contractAddress}`);
    console.log('');
    
    console.log(chalk.blue('💼 Wallet Settings:'));
    console.log(`  Type: ${config.wallet.type}`);
    console.log(`  Default Account: ${config.wallet.defaultAccount || 'None'}`);
    console.log('');
    
    console.log(chalk.blue('📄 Output Settings:'));
    console.log(`  Format: ${config.output.format}`);
    console.log(`  Verbose: ${config.output.verbose}`);
    console.log(`  Colors: ${config.output.colors}`);
    console.log('');
    
    console.log(chalk.blue('📝 Logging Settings:'));
    console.log(`  Level: ${config.logging.level}`);
    console.log(`  File: ${config.logging.file || 'Console only'}`);
    console.log(`  Rotation: ${config.logging.rotation}`);
    
    return config;
  }

  /**
   * Set configuration values
   */
  private async setConfig(args: any): Promise<any> {
    const config = this.configManager.getConfig();
    const updates: any = {};
    let hasUpdates = false;

    // Network settings
    if (args.network) {
      if (!['mainnet', 'testnet', 'local'].includes(args.network)) {
        throw new Error('Network must be one of: mainnet, testnet, local');
      }
      updates.network = { ...config.network, type: args.network };
      
      // Update node URL based on network
      if (args.network === 'mainnet') {
        updates.network.nodeUrl = 'https://api.mainnet.hiro.so';
      } else if (args.network === 'testnet') {
        updates.network.nodeUrl = 'https://api.testnet.hiro.so';
      }
      
      hasUpdates = true;
    }

    if (args['contract-address']) {
      if (!this.configManager.validateNetworkAddress(args['contract-address'])) {
        throw new Error('Invalid contract address format');
      }
      updates.network = { ...config.network, contractAddress: args['contract-address'] };
      hasUpdates = true;
    }

    if (args['node-url']) {
      try {
        new URL(args['node-url']);
        updates.network = { ...config.network, nodeUrl: args['node-url'] };
        hasUpdates = true;
      } catch {
        throw new Error('Invalid node URL format');
      }
    }

    // Output settings
    if (args['output-format']) {
      if (!['json', 'table', 'csv'].includes(args['output-format'])) {
        throw new Error('Output format must be one of: json, table, csv');
      }
      updates.output = { ...config.output, format: args['output-format'] };
      hasUpdates = true;
    }

    if (args.verbose !== undefined) {
      updates.output = { ...config.output, verbose: Boolean(args.verbose) };
      hasUpdates = true;
    }

    if (args.colors !== undefined) {
      updates.output = { ...config.output, colors: Boolean(args.colors) };
      hasUpdates = true;
    }

    // Logging settings
    if (args['log-level']) {
      if (!['debug', 'info', 'warn', 'error'].includes(args['log-level'])) {
        throw new Error('Log level must be one of: debug, info, warn, error');
      }
      updates.logging = { ...config.logging, level: args['log-level'] };
      hasUpdates = true;
    }

    if (!hasUpdates) {
      throw new Error('No configuration updates specified. Use --help to see available options.');
    }

    // Apply updates
    this.configManager.updateConfig(updates);
    
    console.log(chalk.green('✅ Configuration updated successfully!'));
    
    // Show updated config
    return await this.showConfig();
  }

  /**
   * Reset configuration to defaults
   */
  private async resetConfig(): Promise<any> {
    console.log(chalk.yellow('⚠️  Resetting configuration to defaults...'));
    
    // This would reset to default configuration
    const defaultConfig = {
      network: {
        type: 'testnet' as const,
        nodeUrl: 'https://api.testnet.hiro.so',
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      },
      wallet: {
        type: 'software' as const
      },
      output: {
        format: 'table' as const,
        verbose: false,
        colors: true
      },
      logging: {
        level: 'info' as const,
        rotation: true
      }
    };

    this.configManager.updateConfig(defaultConfig);
    
    console.log(chalk.green('✅ Configuration reset to defaults!'));
    
    return await this.showConfig();
  }

  /**
   * Validate current configuration
   */
  private async validateConfig(): Promise<any> {
    const config = this.configManager.getConfig();
    const issues: string[] = [];
    
    console.log(chalk.blue('🔍 Validating configuration...'));
    
    // Validate network settings
    if (!['mainnet', 'testnet', 'local'].includes(config.network.type)) {
      issues.push('Invalid network type');
    }
    
    try {
      new URL(config.network.nodeUrl);
    } catch {
      issues.push('Invalid node URL format');
    }
    
    if (!this.configManager.validateNetworkAddress(config.network.contractAddress)) {
      issues.push('Invalid contract address format');
    }
    
    // Validate output settings
    if (!['json', 'table', 'csv'].includes(config.output.format)) {
      issues.push('Invalid output format');
    }
    
    // Validate logging settings
    if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
      issues.push('Invalid log level');
    }
    
    if (issues.length === 0) {
      console.log(chalk.green('✅ Configuration is valid!'));
      return { valid: true, issues: [] };
    } else {
      console.log(chalk.red('❌ Configuration has issues:'));
      issues.forEach(issue => {
        console.log(chalk.red(`  - ${issue}`));
      });
      return { valid: false, issues };
    }
  }

  /**
   * Export configuration
   */
  private async exportConfig(): Promise<any> {
    const config = this.configManager.getConfig();
    
    console.log(chalk.blue('📤 Exporting configuration...'));
    console.log('');
    console.log(JSON.stringify(config, null, 2));
    
    return {
      exported: true,
      config
    };
  }

  /**
   * Get network-specific defaults
   */
  private getNetworkDefaults(network: string): any {
    const defaults: Record<string, any> = {
      mainnet: {
        nodeUrl: 'https://api.mainnet.hiro.so',
        contractAddress: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      },
      testnet: {
        nodeUrl: 'https://api.testnet.hiro.so',
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      },
      local: {
        nodeUrl: 'http://localhost:3999',
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      }
    };
    
    return defaults[network] || defaults.testnet;
  }
}