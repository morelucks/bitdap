/**
 * NFT Collection Types and Interfaces
 * Type definitions for NFT collection operations
 */

export interface NFTMintRequest {
  recipient: string;
  uri?: string;
  quantity?: number;
}

export interface NFTTransferRequest {
  tokenId: number;
  from: string;
  to: string;
  memo?: string;
}

export interface NFTApprovalRequest {
  tokenId: number;
  approved: string;
}

export interface NFTBatchMintRequest {
  recipients: Array<{
    recipient: string;
    uri?: string;
  }>;
}

export interface NFTBatchTransferRequest {
  transfers: Array<{
    tokenId: number;
    recipient: string;
  }>;
}

export interface NFTBatchBurnRequest {
  tokenIds: number[];
}

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  uri?: string;
}

export interface MintConfiguration {
  price: number;
  perAddressLimit: number;
  maxSupply: number;
  mintingEnabled: boolean;
}

export interface RoyaltyConfiguration {
  recipient: string;
  percentage: number; // In basis points (0-1000 = 0-10%)
}

export interface ContractConfiguration {
  paused: boolean;
  mintingEnabled: boolean;
  owner: string;
}

export interface TokenDetails {
  tokenId: number;
  owner: string;
  uri: string | null;
  approved: string | null;
  exists: boolean;
}

export interface CollectionStatistics {
  totalSupply: number;
  maxSupply: number;
  remainingSupply: number;
  mintedToday: number;
  uniqueHolders: number;
  totalTransfers: number;
  totalRoyaltiesCollected: number;
}

export interface AddressMintInfo {
  address: string;
  mintCount: number;
  remainingMints: number;
  canMint: boolean;
}

export interface MarketplaceInfo {
  floorPrice: number;
  totalVolume: number;
  averagePrice: number;
  activeListings: number;
}

export interface NFTOperationResult {
  success: boolean;
  txId?: string;
  tokenId?: number;
  tokenIds?: number[];
  error?: {
    code: number;
    message: string;
    suggestion?: string;
  };
  gasUsed?: number;
  fee?: number;
}

export interface BatchOperationResult {
  totalOperations: number;
  successful: number;
  failed: number;
  results: NFTOperationResult[];
  executionTime: number;
}

export interface NFTQueryFilter {
  owner?: string;
  tokenIds?: number[];
  hasMetadata?: boolean;
  approved?: string;
  limit?: number;
  offset?: number;
}

export interface NFTQueryResult {
  tokens: TokenDetails[];
  totalCount: number;
  hasMore: boolean;
}

export interface CollectionEvent {
  eventType: string;
  tokenId?: number;
  from?: string;
  to?: string;
  operator?: string;
  blockHeight: number;
  timestamp: string;
  txId: string;
}

export interface AdminOperation {
  operation: string;
  parameters: Record<string, any>;
  requiresOwnership: boolean;
  description: string;
}

export interface FundManagement {
  contractBalance: number;
  totalMintRevenue: number;
  totalRoyalties: number;
  withdrawableAmount: number;
}

export interface SecuritySettings {
  pauseEnabled: boolean;
  emergencyContacts: string[];
  maxBatchSize: number;
  rateLimitEnabled: boolean;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface NFTCommandDefinition {
  name: string;
  description: string;
  category: 'minting' | 'transfer' | 'query' | 'admin' | 'batch';
  aliases?: string[];
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'address' | 'array';
    required: boolean;
    description: string;
    validation?: ValidationRule[];
  }>;
  examples: string[];
  adminOnly?: boolean;
}

export interface NFTCollectionConfig {
  contractAddress: string;
  contractName: string;
  network: 'mainnet' | 'testnet' | 'local';
  defaultGasLimit: number;
  defaultFee: number;
  batchSizeLimit: number;
  rateLimitDelay: number;
}

export interface MetadataStandard {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  background_color?: string;
  youtube_url?: string;
}

export interface IPFSMetadata {
  hash: string;
  url: string;
  pinned: boolean;
  size: number;
  uploadedAt: string;
}

export interface CollectionAnalytics {
  dailyMints: number[];
  dailyTransfers: number[];
  topHolders: Array<{
    address: string;
    tokenCount: number;
    percentage: number;
  }>;
  mintingTrends: {
    peakHour: number;
    peakDay: string;
    averagePerDay: number;
  };
  priceAnalytics: {
    averageMintPrice: number;
    totalRevenue: number;
    projectedRevenue: number;
  };
}

export interface ExportFormat {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata: boolean;
  includeOwnership: boolean;
  includeTransfers: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ImportFormat {
  format: 'json' | 'csv';
  mapping: Record<string, string>;
  validation: ValidationRule[];
  batchSize: number;
}

// Error types specific to NFT operations
export enum NFTErrorCode {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INVALID_AMOUNT = 400,
  INSUFFICIENT_PAYMENT = 402,
  MINT_LIMIT_EXCEEDED = 403,
  MAX_SUPPLY_REACHED = 405,
  CONTRACT_PAUSED = 406,
  SELF_TRANSFER = 407,
  INVALID_ROYALTY = 408,
  INVALID_RECIPIENT = 409,
  TOKEN_EXISTS = 410,
  MINTING_DISABLED = 411,
  INVALID_TOKEN_ID = 412,
  BATCH_LIMIT_EXCEEDED = 413,
  INVALID_METADATA = 414,
  TRANSFER_FAILED = 415
}

// Command categories for organization
export enum CommandCategory {
  MINTING = 'minting',
  TRANSFER = 'transfer',
  QUERY = 'query',
  ADMIN = 'admin',
  BATCH = 'batch',
  APPROVAL = 'approval',
  ROYALTY = 'royalty',
  METADATA = 'metadata'
}

// Operation types for logging and analytics
export enum OperationType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  BURN = 'burn',
  APPROVE = 'approve',
  SET_APPROVAL_FOR_ALL = 'set-approval-for-all',
  BATCH_MINT = 'batch-mint',
  BATCH_TRANSFER = 'batch-transfer',
  BATCH_BURN = 'batch-burn',
  SET_COLLECTION_METADATA = 'set-collection-metadata',
  SET_MINT_PRICE = 'set-mint-price',
  PAUSE_CONTRACT = 'pause-contract',
  UNPAUSE_CONTRACT = 'unpause-contract',
  WITHDRAW_FUNDS = 'withdraw-funds',
  SET_ROYALTY = 'set-royalty'
}

// Status types for operations
export enum OperationStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}