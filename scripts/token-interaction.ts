#!/usr/bin/env node

/**
 * Bitdap Token Interaction Script
 * 
 * A comprehensive command-line interface for interacting with the Bitdap Pass NFT contract.
 * 
 * Features:
 * - Token minting, transfers, and burns
 * - Contract state queries and information
 * - Configuration management
 * - Comprehensive error handling and logging
 * - Multiple output formats (JSON, table, CSV)
 * - Secure wallet integration
 * 
 * Usage:
 *   npm run token-interact <command> [options]
 *   npm run token-interact --help
 * 
 * Examples:
 *   npm run token-interact mint --tier 1 --private-key YOUR_KEY
 *   npm run token-interact transfer --token-id 1 --recipient ST1... --private-key YOUR_KEY
 *   npm run token-interact query --type supply
 *   npm run token-interact config --action show
 */

import chalk from 'chalk';
import { CLIInterface } from './cli/cli-interface.js';
import { ConfigManager } from './config/config-manager.js';
import { Logger } from './logging/logger.js';
import { ErrorHandler } from './error/error-handler.js';

/**
 * Main application class
 */
class BitdapTokenScript {
  private cli: CLIInterface;
  private configManager: ConfigManager;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.cli = new CLIInterface();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    try {
      // Set up global error handlers
      this.errorHandler.setupGlobalErrorHandlers();
      
      // Display startup banner
      this.displayBanner();
      
      // Show current configuration
      this.configManager.displayCurrentConfig();
      
      // Initialize CLI
      await this.cli.initialize();
      
      this.logger.info('Bitdap Token Script initialized successfully');
      
    } catch (error: any) {
      this.logger.error('Failed to initialize application', { error: error.message });
      console.error(chalk.red('❌ Failed to initialize:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      await this.initialize();
      await this.cli.start();
    } catch (error: any) {
      this.logger.error('Application startup failed', { error: error.message });
      console.error(chalk.red('❌ Startup failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Display startup banner
   */
  private displayBanner(): void {
    const config = this.configManager.getConfig();
    
    if (config.output.colors) {
      console.log(chalk.blue('🚀 Bitdap Token Interaction Script'));
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.green('✨ Ready to interact with Bitdap Pass NFTs'));
      console.log(chalk.gray('━'.repeat(50)));
    } else {
      console.log('🚀 Bitdap Token Interaction Script');
      console.log('━'.repeat(50));
      console.log('✨ Ready to interact with Bitdap Pass NFTs');
      console.log('━'.repeat(50));
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      this.logger.info('Application shutting down gracefully');
      await this.logger.flush();
      process.exit(0);
    } catch (error: any) {
      console.error(chalk.red('❌ Shutdown error:'), error.message);
      process.exit(1);
    }
  }
}

/**
 * Application entry point
 */
async function main(): Promise<void> {
  const app = new BitdapTokenScript();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
    await app.shutdown();
  });
  
  process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
    await app.shutdown();
  });
  
  // Start the application
  await app.start();
}

// Run the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}