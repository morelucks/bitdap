# WalletConnect Protocol Integration Guide

## Overview

This guide explains how to set up and use WalletConnect Protocol integration in Bitdap.

## Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager
- WalletConnect Project ID (get one at https://cloud.walletconnect.com)

## Installation

### 1. Install Dependencies

```bash
cd bitdap-frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `bitdap-frontend` directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

### 3. Get WalletConnect Project ID

1. Visit https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Add it to `.env.local`

## Usage

### Basic Setup

Wrap your app with WalletConnectProvider:

```tsx
import { WalletConnectProvider } from '@/context/WalletConnectContext';

export default function App() {
  return (
    <WalletConnectProvider>
      <YourApp />
    </WalletConnectProvider>
  );
}
```

### Using the Hook

```tsx
import { useWalletConnect } from '@/hooks/useWalletConnect';

export function MyComponent() {
  const { address, isConnected, connect, disconnect } = useWalletConnect();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Using the Button Component

```tsx
import { WalletConnectButton } from '@/components/WalletConnectButton';

export function Header() {
  return <WalletConnectButton variant="primary" size="md" />;
}
```

## Supported Wallets

WalletConnect supports any wallet that implements the WalletConnect protocol, including:

- MetaMask (with Stacks support)
- Ledger Live
- Trust Wallet
- Coinbase Wallet
- And many more...

## Troubleshooting

### Project ID Not Found

Make sure you have set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your `.env.local` file.

### QR Code Not Displaying

Check that `qrcode.react` is installed and imported correctly.

### Connection Timeout

- Ensure your wallet app is open
- Check your internet connection
- Try scanning the QR code again

## API Reference

### useWalletConnect Hook

```typescript
const {
  isConnected,      // boolean - connection status
  address,          // string | null - wallet address
  chainId,          // number - current chain ID
  session,          // WalletConnectSession | null - session data
  isConnecting,     // boolean - connection in progress
  error,            // string | null - error message
  connect,          // () => Promise<void> - initiate connection
  disconnect,       // () => Promise<void> - disconnect wallet
  switchNetwork,    // (network: 'mainnet' | 'testnet') => Promise<void>
  showQRCode,       // boolean - QR code modal visibility
  qrCodeUri,        // string | null - QR code URI
} = useWalletConnect();
```

## Security Considerations

- Never expose your Project ID in client-side code (it's safe as NEXT_PUBLIC_*)
- Always validate addresses on the backend
- Use HTTPS in production
- Keep WalletConnect SDK updated

## Support

For issues or questions, visit:
- WalletConnect Docs: https://docs.walletconnect.com
- Stacks Docs: https://docs.stacks.co
