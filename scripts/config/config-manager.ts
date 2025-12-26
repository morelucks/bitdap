/**
 * Configuration Manager
 * Handles loading, validation, and management of application configuration
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { ScriptConfig, NetworkConfig } from './types.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ScriptConfig;
  private configPath: string;

  private constructor() {
    this.configPath = join(process.cwd(), '.bitdap', 'config.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getDefaultConfig(): ScriptConfig {
    return {
      network: {
        type: 'testnet',
        nodeUrl: 'https://api.testnet.hiro.so',
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      },
      wallet: {
        type: 'software'
      },
      output: {
        format: 'table',
        verbose: false,
        colors: true
      },
      logging: {
        level: 'info',
        rotation: true
      }
    };
  }

  private loadConfig(): ScriptConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        return this.validateConfig(parsedConfig);
      } else {
        const defaultConfig = this.getDefaultConfig();
        this.saveConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
      return this.getDefaultConfig();
    }
  }

  private validateConfig(config: any): ScriptConfig {
    const defaultConfig = this.getDefaultConfig();
    
    // Merge with defaults to ensure all required fields exist
    return {
      network: {
        type: config.network?.type || defaultConfig.network.type,
        nodeUrl: config.network?.nodeUrl || defaultConfig.network.nodeUrl,
        contractAddress: config.network?.contractAddress || defaultConfig.network.contractAddress
      },
      wallet: {
        type: config.wallet?.type || defaultConfig.wallet.type,
        defaultAccount: config.wallet?.defaultAccount
      },
      output: {
        format: config.output?.format || defaultConfig.output.format,
        verbose: config.output?.verbose ?? defaultConfig.output.verbose,
        colors: config.output?.colors ?? defaultConfig.output.colors
      },
      logging: {
        level: config.logging?.level || defaultConfig.logging.level,
        file: config.logging?.file,
        rotation: config.logging?.rotation ?? defaultConfig.logging.rotation
      }
    };
  }

  private saveConfig(config: ScriptConfig): void {
    try {
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  public getConfig(): ScriptConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ScriptConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig(this.config);
  }

  public updateNetworkConfig(networkConfig: Partial<NetworkConfig>): void {
    this.config.network = { ...this.config.network, ...networkConfig };
    this.saveConfig(this.config);
  }

  public validateNetworkAddress(address: string): boolean {
    // Basic Stacks address validation
    const stacksAddressRegex = /^S[0-9A-Z]{39}$/;
    return stacksAddressRegex.test(address);
  }

  public getNetworkUrl(): string {
    return this.config.network.nodeUrl;
  }

  public getContractAddress(): string {
    return this.config.network.contractAddress;
  }

  public isMainnet(): boolean {
    return this.config.network.type === 'mainnet';
  }

  public displayCurrentConfig(): void {
    console.log('\n📋 Current Configuration:');
    console.log(`Network: ${this.config.network.type}`);
    console.log(`Node URL: ${this.config.network.nodeUrl}`);
    console.log(`Contract: ${this.config.network.contractAddress}`);
    console.log(`Output Format: ${this.config.output.format}`);
    console.log(`Log Level: ${this.config.logging.level}`);
    console.log('');
  }
}