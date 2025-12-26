/**
 * Configuration types and interfaces for the token interaction script
 */

export interface NetworkConfig {
  type: 'mainnet' | 'testnet' | 'local';
  nodeUrl: string;
  contractAddress: string;
}

export interface WalletConfig {
  type: 'software' | 'hardware' | 'web';
  defaultAccount?: string;
}

export interface OutputConfig {
  format: 'json' | 'table' | 'csv';
  verbose: boolean;
  colors: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  rotation: boolean;
}

export interface ScriptConfig {
  network: NetworkConfig;
  wallet: WalletConfig;
  output: OutputConfig;
  logging: LoggingConfig;
}

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  parameters: ParameterDefinition[];
  examples: string[];
  handler: CommandHandler;
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'address';
  required: boolean;
  description: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  blockHeight?: number;
  events: ContractEvent[];
  gasUsed: number;
  fee: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    suggestion?: string;
  };
}

export interface ContractEvent {
  type: string;
  data: Record<string, any>;
}

export interface BatchOperation {
  id: string;
  command: string;
  parameters: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  result?: TransactionResult;
  error?: string;
}

export interface BatchResult {
  totalOperations: number;
  successful: number;
  failed: number;
  skipped: number;
  operations: BatchOperation[];
  executionTime: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  category: 'validation' | 'network' | 'contract' | 'wallet' | 'system';
  details?: Record<string, any>;
  suggestions?: string[];
  recoverable: boolean;
}

export type CommandHandler = (args: any) => Promise<any>;