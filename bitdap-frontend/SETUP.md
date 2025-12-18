# Bitdap Frontend Setup Guide

## Prerequisites

- Node.js >= 18.17.0
- npm or yarn
- Hiro Wallet browser extension (for wallet connection)

## Installation

### 1. Install Dependencies

```bash
cd bitdap-frontend
npm install
```

### 2. Environment Configuration

Create `.env.local` file in the `bitdap-frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Network: mainnet or testnet
NEXT_PUBLIC_STACKS_NETWORK=testnet

# Contract addresses (update with deployed addresses)
NEXT_PUBLIC_BITDAP_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap-token

# Hiro API endpoints
NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so
NEXT_PUBLIC_HIRO_API_BASE=https://api.testnet.hiro.so
```

### 3. Install Hiro Wallet

1. Visit https://www.hiro.so/wallet
2. Download the browser extension for your browser
3. Install the extension
4. Create a new wallet or import existing one
5. Save your seed phrase securely

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Features

### Wallet Connection
- Click "Connect Wallet" button
- Approve connection in Hiro Wallet popup
- Your address and network will be displayed

### Network Switching
- Use the network selector dropdown
- Choose between Testnet and Mainnet
- Wallet will automatically disconnect when switching networks

### Wallet Status
- Connected address is displayed (truncated)
- Current network is shown
- Connection status indicator

## Project Structure

```
bitdap-frontend/
├── app/
│   ├── layout.tsx          # Root layout with WalletProvider
│   ├── page.tsx            # Home page with WalletConnect
│   └── globals.css         # Global styles
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx       # Main wallet connection component
│   │   ├── WalletConnect.module.css
│   │   ├── WalletStatus.tsx        # Wallet status display
│   │   └── WalletStatus.module.css
│   ├── context/
│   │   └── WalletContext.tsx       # Wallet state context
│   ├── hooks/
│   │   ├── useStacksNetwork.ts     # Network hook
│   │   └── useContractRead.ts      # Contract read hook
│   └── config/
│       └── contracts.ts            # Contract configuration
├── package.json
├── tsconfig.json
├── next.config.mjs
└── SETUP.md                        # This file
```

## Usage Examples

### Using Wallet Context

```tsx
import { useWallet } from '@/context/WalletContext';

export function MyComponent() {
  const { address, network, isConnected, connect, disconnect } = useWallet();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Address: {address}</p>
          <p>Network: {network}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Reading Contract State

```tsx
import { useContractRead } from '@/hooks/useContractRead';
import { Cl } from '@stacks/transactions';

export function GetCounters() {
  const { data, isLoading, execute } = useContractRead({
    contractAddress: process.env.NEXT_PUBLIC_BITDAP_CONTRACT!,
    contractName: 'bitdap',
    functionName: 'get-counters',
    functionArgs: [],
  });

  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Counters'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

## Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet connection button doesn't work
- **Solution**: Ensure Hiro Wallet extension is installed and enabled
- **Solution**: Check browser console for error messages
- **Solution**: Try refreshing the page

**Problem**: Wrong network displayed
- **Solution**: Verify `NEXT_PUBLIC_STACKS_NETWORK` environment variable
- **Solution**: Check Hiro Wallet is set to correct network
- **Solution**: Try switching networks in the dropdown

**Problem**: Address not persisting after refresh
- **Solution**: Check browser localStorage is enabled
- **Solution**: Verify no browser extensions blocking storage
- **Solution**: Check browser privacy settings

### Build Issues

**Problem**: TypeScript errors
```bash
npm run typecheck
```

**Problem**: Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## Testing

### Manual Testing Checklist

- [ ] Wallet connects successfully
- [ ] Address displays correctly
- [ ] Network selector works
- [ ] Can switch between mainnet/testnet
- [ ] Wallet disconnects properly
- [ ] State persists after page refresh
- [ ] Responsive on mobile devices
- [ ] No console errors

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Deploy the `.next` directory
3. Set environment variables on the platform
4. Configure Node.js runtime

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the WALLET_CONNECT_FEATURE.md documentation
3. Check browser console for error messages
4. Verify environment variables are set correctly

## Next Steps

- Implement contract interaction functions
- Add transaction signing
- Create NFT minting interface
- Add token transfer functionality
- Implement marketplace features
