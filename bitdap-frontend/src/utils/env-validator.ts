/**
 * Environment Variable Validator
 * Validates required AppKit configuration on application startup
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAppKitConfig(): ValidationResult {
  const errors: string[] = [];

  // Check Project ID
  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    errors.push(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Please configure it in .env.local'
    );
  }

  // Check App Name
  if (!process.env.NEXT_PUBLIC_APP_NAME) {
    errors.push('NEXT_PUBLIC_APP_NAME is not set. Please configure it in .env.local');
  }

  // Check Network
  const validNetworks = ['mainnet', 'testnet'];
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
  if (!validNetworks.includes(network)) {
    errors.push(
      `NEXT_PUBLIC_STACKS_NETWORK must be one of: ${validNetworks.join(', ')}. Got: ${network}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function logValidationErrors(result: ValidationResult): void {
  if (!result.isValid) {
    console.error('❌ AppKit Configuration Validation Failed:');
    result.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
  }
}
