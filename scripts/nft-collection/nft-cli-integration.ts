/**
 * NFT Collection CLI Integration
 * Integrates NFT collection commands into the main CLI system
 */

import { CommandRouter } from '../cli/command-router.js';
import { MintNFTCommand } from './commands/mint-nft-command.js';
import { TransferNFTCommand } from './commands/transfer-nft-command.js';
import { ApproveNFTCommand } from './commands/approve-nft-command.js';
import { QueryNFTCommand } from './commands/query-nft-command.js';
import { AdminNFTCommand } from './commands/admin-nft-command.js';
import { BatchNFTCommand } from './commands/batch-nft-command.js';
import { MetadataNFTCommand } from './commands/metadata-nft-command.js';
import { AnalyticsNFTCommand } from './commands/analytics-nft-command.js';
import { MarketplaceNFTCommand } from './commands/marketplace-nft-command.js';
import { Logger } from '../logging/logger.js';
import chalk from 'chalk';

export class NFTCLIIntegration {
  private router: CommandRouter;
  private logger: Logger;
  private commands: Map<string, any> = new Map();

  constructor(router: CommandRouter) {
    this.router = router;
    this.logger = Logger.getInstance();
    this.initializeCommands();
  }

  /**
   * Initialize all NFT collection commands
   */
  private initializeCommands(): void {
    // Create command instances
    const mintCommand = new MintNFTCommand();
    const transferCommand = new TransferNFTCommand();
    const approveCommand = new ApproveNFTCommand();
    const queryCommand = new QueryNFTCommand();
    const adminCommand = new AdminNFTCommand();
    const batchCommand = new BatchNFTCommand();
    const metadataCommand = new MetadataNFTCommand();
    const analyticsCommand = new AnalyticsNFTCommand();
    const marketplaceCommand = new MarketplaceNFTCommand();

    // Store command instances
    this.commands.set('mint', mintCommand);
    this.commands.set('transfer', transferCommand);
    this.commands.set('approve', approveCommand);
    this.commands.set('query', queryCommand);
    this.commands.set('admin', adminCommand);
    this.commands.set('batch', batchCommand);
    this.commands.set('metadata', metadataCommand);
    this.commands.set('analytics', analyticsCommand);
    this.commands.set('marketplace', marketplaceCommand);

    // Register commands with router
    this.router.registerCommand(mintCommand.getDefinition());
    this.router.registerCommand(transferCommand.getDefinition());
    this.router.registerCommand(approveCommand.getDefinition());
    this.router.registerCommand(queryCommand.getDefinition());
    this.router.registerCommand(adminCommand.getDefinition());
    this.router.registerCommand(batchCommand.getDefinition());
    this.router.registerCommand(metadataCommand.getDefinition());
    this.router.registerCommand(analyticsCommand.getDefinition());
    this.router.registerCommand(marketplaceCommand.getDefinition());

    this.logger.info('NFT collection commands registered', {
      commandCount: this.commands.size,
      commands: Array.from(this.commands.keys())
    });
  }

  /**
   * Get all NFT collection commands
   */
  public getCommands(): Map<string, any> {
    return this.commands;
  }

  /**
   * Get command by name
   */
  public getCommand(name: string): any {
    return this.commands.get(name);
  }

  /**
   * Display NFT collection help
   */
  public displayNFTHelp(): void {
    console.log(chalk.blue('\n🎨 NFT Collection Commands:\n'));
    
    console.log(chalk.green('Minting:'));
    console.log('  nft-mint        - Mint new NFTs in the collection');
    console.log('  mint-nft        - Alias for nft-mint');
    console.log('  nm              - Short alias for nft-mint');
    
    console.log(chalk.green('\nTransfers:'));
    console.log('  nft-transfer    - Transfer NFTs to another address');
    console.log('  transfer-nft    - Alias for nft-transfer');
    console.log('  nt              - Short alias for nft-transfer');
    
    console.log(chalk.green('\nApprovals:'));
    console.log('  nft-approve     - Approve operators for NFT transfers');
    console.log('  approve-nft     - Alias for nft-approve');
    console.log('  na              - Short alias for nft-approve');
    
    console.log(chalk.green('\nQueries:'));
    console.log('  nft-query       - Query NFT collection information');
    console.log('  query-nft       - Alias for nft-query');
    console.log('  nq              - Short alias for nft-query');
    
    console.log(chalk.green('\nAdministration:'));
    console.log('  nft-admin       - Administrative operations (owner only)');
    console.log('  admin-nft       - Alias for nft-admin');
    console.log('  nadmin          - Short alias for nft-admin');
    
    console.log(chalk.green('\nBatch Operations:'));
    console.log('  nft-batch       - Execute batch operations');
    console.log('  batch-nft       - Alias for nft-batch');
    console.log('  nbatch          - Short alias for nft-batch');
    
    console.log(chalk.green('\nMetadata:'));
    console.log('  nft-metadata    - Create and manage NFT metadata');
    console.log('  metadata-nft    - Alias for nft-metadata');
    console.log('  nmeta           - Short alias for nft-metadata');
    
    console.log(chalk.green('\nAnalytics:'));
    console.log('  nft-analytics   - Generate analytics and reports');
    console.log('  analytics-nft   - Alias for nft-analytics');
    console.log('  nanalytics      - Short alias for nft-analytics');
    
    console.log(chalk.green('\nMarketplace:'));
    console.log('  nft-marketplace - Access marketplace data');
    console.log('  marketplace-nft - Alias for nft-marketplace');
    console.log('  nmarket         - Short alias for nft-marketplace');
    
    console.log(chalk.yellow('\nExamples:'));
    console.log('  npm run token-interact nft-mint --recipient ST1ADDR... --private-key YOUR_KEY');
    console.log('  npm run token-interact nft-query --type collection');
    console.log('  npm run token-interact nft-analytics --type summary');
    console.log('  npm run token-interact nft-marketplace --action info');
    
    console.log(chalk.gray('\nUse --help with any command for detailed information.'));
  }

  /**
   * Get command statistics
   */
  public getCommandStatistics(): any {
    return {
      totalCommands: this.commands.size,
      commandTypes: {
        minting: 1,
        transfers: 1,
        approvals: 1,
        queries: 1,
        administration: 1,
        batch: 1,
        metadata: 1,
        analytics: 1,
        marketplace: 1
      },
      aliases: {
        'nft-mint': ['mint-nft', 'nm'],
        'nft-transfer': ['transfer-nft', 'nt'],
        'nft-approve': ['approve-nft', 'na'],
        'nft-query': ['query-nft', 'nq'],
        'nft-admin': ['admin-nft', 'nadmin'],
        'nft-batch': ['batch-nft', 'nbatch'],
        'nft-metadata': ['metadata-nft', 'nmeta'],
        'nft-analytics': ['analytics-nft', 'nanalytics'],
        'nft-marketplace': ['marketplace-nft', 'nmarket']
      }
    };
  }

  /**
   * Validate NFT command parameters
   */
  public validateNFTCommand(commandName: string, args: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Common validations for NFT commands
    if (args['private-key'] && !this.isValidPrivateKey(args['private-key'])) {
      errors.push('Invalid private key format');
    }
    
    if (args.recipient && !this.isValidAddress(args.recipient)) {
      errors.push('Invalid recipient address format');
    }
    
    if (args.operator && !this.isValidAddress(args.operator)) {
      errors.push('Invalid operator address format');
    }
    
    if (args['token-id'] && (isNaN(args['token-id']) || args['token-id'] < 1)) {
      errors.push('Token ID must be a positive number');
    }
    
    // Command-specific validations
    switch (commandName) {
      case 'nft-mint':
      case 'mint-nft':
        if (!args.recipient) {
          errors.push('Recipient address is required for minting');
        }
        if (args.quantity && (isNaN(args.quantity) || args.quantity < 1 || args.quantity > 10)) {
          errors.push('Quantity must be between 1 and 10');
        }
        break;
        
      case 'nft-transfer':
      case 'transfer-nft':
        if (!args['token-id']) {
          errors.push('Token ID is required for transfer');
        }
        if (!args.from || !args.to) {
          errors.push('Both from and to addresses are required for transfer');
        }
        break;
        
      case 'nft-approve':
      case 'approve-nft':
        if (!args.action) {
          errors.push('Action is required for approval operations');
        }
        if (!args.operator) {
          errors.push('Operator address is required for approval');
        }
        if (['approve', 'revoke'].includes(args.action) && !args['token-id']) {
          errors.push('Token ID is required for token-specific approval actions');
        }
        break;
        
      case 'nft-query':
      case 'query-nft':
        if (!args.type) {
          errors.push('Query type is required');
        }
        break;
        
      case 'nft-admin':
      case 'admin-nft':
        if (!args.action) {
          errors.push('Admin action is required');
        }
        break;
        
      case 'nft-batch':
      case 'batch-nft':
        if (!args.operation) {
          errors.push('Batch operation type is required');
        }
        if (!args['create-sample'] && !args.file && !args.recipients && !args['token-ids']) {
          errors.push('Either file, recipients, token-ids, or create-sample must be specified');
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get command suggestions for NFT operations
   */
  public getNFTCommandSuggestions(input: string): string[] {
    const nftCommands = [
      'nft-mint', 'mint-nft', 'nm',
      'nft-transfer', 'transfer-nft', 'nt',
      'nft-approve', 'approve-nft', 'na',
      'nft-query', 'query-nft', 'nq',
      'nft-admin', 'admin-nft', 'nadmin',
      'nft-batch', 'batch-nft', 'nbatch'
    ];
    
    return nftCommands
      .filter(cmd => cmd.includes(input.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Execute NFT command with enhanced error handling
   */
  public async executeNFTCommand(commandName: string, args: any): Promise<any> {
    try {
      // Validate command parameters
      const validation = this.validateNFTCommand(commandName, args);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Log command execution
      this.logger.info('Executing NFT command', {
        command: commandName,
        args: this.sanitizeArgs(args)
      });

      // Execute command through router
      return await this.router.executeCommand(commandName, args);

    } catch (error: any) {
      this.logger.error('NFT command execution failed', {
        command: commandName,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get NFT collection status
   */
  public async getNFTCollectionStatus(): Promise<any> {
    try {
      const queryCommand = this.commands.get('query') as QueryNFTCommand;
      if (!queryCommand) {
        throw new Error('Query command not available');
      }

      return await queryCommand.getCollectionStatistics();
    } catch (error: any) {
      this.logger.error('Failed to get NFT collection status', { error: error.message });
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private isValidPrivateKey(privateKey: string): boolean {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return /^[0-9a-fA-F]{64}$/.test(cleanKey);
  }

  private isValidAddress(address: string): boolean {
    return /^S[0-9A-Z]{39}$/.test(address);
  }

  private sanitizeArgs(args: any): any {
    const sanitized = { ...args };
    if (sanitized['private-key']) {
      sanitized['private-key'] = '[REDACTED]';
    }
    return sanitized;
  }

  /**
   * Display NFT collection banner
   */
  public displayNFTBanner(): void {
    console.log(chalk.blue('🎨 NFT Collection Interface'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.green('✨ Ready to manage your NFT collection'));
    console.log(chalk.gray('━'.repeat(50)));
  }

  /**
   * Get available NFT operations
   */
  public getAvailableOperations(): string[] {
    return [
      'mint',      // Mint new NFTs
      'transfer',  // Transfer NFTs
      'approve',   // Manage approvals
      'query',     // Query information
      'admin',     // Administrative operations
      'batch'      // Batch operations
    ];
  }

  /**
   * Check if command is NFT-related
   */
  public isNFTCommand(commandName: string): boolean {
    const nftCommands = [
      'nft-mint', 'mint-nft', 'nm',
      'nft-transfer', 'transfer-nft', 'nt',
      'nft-approve', 'approve-nft', 'na',
      'nft-query', 'query-nft', 'nq',
      'nft-admin', 'admin-nft', 'nadmin',
      'nft-batch', 'batch-nft', 'nbatch',
      'nft-metadata', 'metadata-nft', 'nmeta',
      'nft-analytics', 'analytics-nft', 'nanalytics',
      'nft-marketplace', 'marketplace-nft', 'nmarket'
    ];
    
    return nftCommands.includes(commandName);
  }
}