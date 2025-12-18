export enum TxStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  DROPPED = 'dropped'
}

export interface TxDetails {
  hash: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
  blockHeight?: number;
  timestamp?: number;
}

export interface TxResult {
  success: boolean;
  txHash: string;
  details: TxDetails;
  error?: string;
}

export interface FormState {
  recipient: string;
  amount: string;
  isValid: boolean;
  errors: FormErrors;
}

export interface FormErrors {
  recipient?: string;
  amount?: string;
  general?: string;
}

export interface BalanceState {
  current: bigint;
  formatted: string;
  isLoading: boolean;
  lastUpdated: Date;
}