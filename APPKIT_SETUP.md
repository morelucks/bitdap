# AppKit Integration Setup Guide

## Overview

This guide walks you through setting up and using the AppKit integration in the Bitdap frontend. AppKit provides a comprehensive Web3 modal and wallet connection solution for Stacks blockchain applications.

## Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager
- A WalletConnect Project ID (get one at https://cloud.walletconnect.com)

## Installation

### 1. Install Dependencies

```bash
cd bitdap-frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `bitdap-frontend` directory:

```bash
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Stacks Network Configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet

# Application Configuration
NEXT_PUBLIC_APP_NAME=Bitdap
NEXT_PUBLIC_APP_DESCRIPTION=NFT Pass Collection on Stacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Get a WalletConnect Project ID

1. Visit https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Paste it into `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Usage

### Basic Setup

The AppKit provider is already configured in the root layout. It wraps the entire application and provides wallet connection functionality.

### Using AppKit Hooks

#### useAppKit Hook

Access the main AppKit connection state:

```typescript
import { useAppKit } from '@hooks/useAppKit';

export function MyComponent() {
  const { isConnected, account, connect, disconnect } = useAppKit();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {account}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

#### useAccount Hook

Access account-specific information:

```typescript
import { useAccount } from '@hooks/useAccount';

export function AccountInfo() {
  const { address, balance, copyAddress, formatAddress } = useAccount();

  return (
    <div>
      <p>Address: {formatAddress(address)}</p>
      <p>Balance: {balance} STX</p>
      <button onClick={copyAddress}>Copy Address</button>
    </div>
  );
}
```

#### useNetwork Hook

Handle network switching:

```typescript
import { useNetwork } from '@hooks/useNetwork';

export function NetworkSelector() {
  const { network, switchToMainnet, switchToTestnet } = useNetwork();

  return (
    <div>
      <p>Current Network: {network}</p>
      <button onClick={switchToMainnet}>Switch to Mainnet</button>
      <button onClick={switchToTestnet}>Switch to Testnet</button>
    </div>
  );
}
```

#### useTransaction Hook

Send transactions:

```typescript
import { useTransaction } from '@hooks/useTransaction';

export function SendTransaction() {
  const { sendTransaction, status, txId } = useTransaction();

  const handleSend = async () => {
    try {
      const txId = await sendTransaction(
        'ST1234567890ABCDEFGHIJKLMNOPQRST',
        '100'
      );
      console.log('Transaction sent:', txId);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleSend}>Send Transaction</button>
      {status && <p>Status: {status}</p>}
      {txId && <p>TX ID: {txId}</p>}
    </div>
  );
}
```

### Using UI Components

#### AppKitButton

Display a connect/disconnect button:

```typescript
import { AppKitButton } from '@components/AppKitButton';

export function Header() {
  return (
    <header>
      <h1>Bitdap</h1>
      <AppKitButton />
    </header>
  );
}
```

#### AccountDisplay

Show connected account information:

```typescript
import { AccountDisplay } from '@components/AccountDisplay';

export function Dashboard() {
  return (
    <div>
      <AccountDisplay />
    </div>
  );
}
```

#### NetworkSwitcher

Allow users to switch networks:

```typescript
import { NetworkSwitcher } from '@components/NetworkSwitcher';

export function Settings() {
  return (
    <div>
      <NetworkSwitcher />
    </div>
  );
}
```

#### TransactionStatus

Display transaction status:

```typescript
import { TransactionStatus } from '@components/TransactionStatus';

export function TransactionPage() {
  const [txId, setTxId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed' | null>(null);

  return (
    <div>
      <TransactionStatus txId={txId} status={status} />
    </div>
  );
}
```

## Supported Wallets

AppKit supports the following Stacks wallets:

- **Hiro Wallet** - https://wallet.hiro.so
- **Leather Wallet** - https://leather.io
- **Xverse Wallet** - https://www.xverse.app

## Troubleshooting

### Project ID Not Set

**Error:** `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set`

**Solution:** Add your WalletConnect Project ID to `.env.local`

### Wallet Not Connecting

**Error:** Connection fails or modal doesn't appear

**Solutions:**
1. Ensure the wallet extension is installed
2. Check that you're on the correct network (testnet/mainnet)
3. Try refreshing the page
4. Clear browser cache and cookies
5. Check browser console for detailed error messages

### Network Mismatch

**Error:** "Network mismatch" or "Wrong network"

**Solution:** Switch to the correct network in your wallet extension

### Transaction Fails

**Error:** Transaction rejected or fails to submit

**Solutions:**
1. Check your account balance
2. Verify the recipient address is valid
3. Check network connectivity
4. Review transaction parameters
5. Check browser console for error details

## Development

### Running Tests

```bash
npm run test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
```

### Starting Production Server

```bash
npm run start
```

## API Reference

### AppKitContext

```typescript
interface AppKitContextType {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  network: string;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}
```

### Transaction Types

```typescript
interface TransactionParams {
  to: string;
  amount: string;
  functionName?: string;
  functionArgs?: any[];
}

interface TransactionResult {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}
```

## Best Practices

1. **Always check connection status** before attempting transactions
2. **Handle errors gracefully** with user-friendly messages
3. **Validate addresses** before sending transactions
4. **Store connection state** for better UX
5. **Test on testnet first** before mainnet deployment
6. **Monitor transaction status** and provide feedback to users
7. **Use proper error boundaries** to catch and handle errors

## Security Considerations

1. Never store private keys in the browser
2. Always validate user input before transactions
3. Use HTTPS in production
4. Keep dependencies updated
5. Implement proper error handling
6. Use environment variables for sensitive data
7. Validate all contract interactions

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the AppKit documentation: https://docs.walletconnect.com/appkit
3. Check browser console for error messages
4. Open an issue on GitHub

## Additional Resources

- [WalletConnect Documentation](https://docs.walletconnect.com)
- [Stacks Documentation](https://docs.stacks.co)
- [Hiro Wallet](https://wallet.hiro.so)
- [Leather Wallet](https://leather.io)
- [Xverse Wallet](https://www.xverse.app)
