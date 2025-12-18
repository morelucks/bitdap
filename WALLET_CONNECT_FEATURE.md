# Stacks Wallet Connect Feature

## Overview
This feature integrates Stacks wallet connectivity into the Bitdap frontend, enabling users to connect their wallets (e.g., Hiro Wallet) and interact with the Bitdap Pass contracts on Stacks mainnet or testnet.

## Features

### 1. Wallet Connection
- **Hiro Wallet Integration**: Seamless connection with Hiro Wallet browser extension
- **Network Selection**: Switch between Stacks Mainnet and Testnet
- **Session Persistence**: Wallet state persists across page reloads
- **Auto-disconnect on Network Switch**: Automatically disconnects when switching networks

### 2. Address Display
- **Connected Address**: Shows truncated wallet address (first 6 + last 4 characters)
- **Full Address Tooltip**: Hover to see full address
- **Network Indicator**: Displays current network (Mainnet/Testnet)
- **Connection Status**: Visual indicator of wallet connection state

### 3. User Experience
- **Loading States**: Shows "Connecting..." during wallet connection
- **Error Handling**: Graceful error handling with user feedback
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Components

### WalletConnect Component
Main component for wallet connection UI.

**Location**: `bitdap-frontend/src/components/WalletConnect.tsx`

**Features**:
- Network selector dropdown
- Connect/Disconnect buttons
- Address and network display
- Loading states

**Usage**:
```tsx
import { WalletConnect } from '@/components/WalletConnect';

export default function App() {
  return <WalletConnect />;
}
```

### WalletStatus Component
Displays current wallet connection status.

**Location**: `bitdap-frontend/src/components/WalletStatus.tsx`

**Features**:
- Connection indicator
- Address display
- Network badge
- Pulsing animation for disconnected state

**Usage**:
```tsx
import { WalletStatus } from '@/components/WalletStatus';

export default function Dashboard() {
  return <WalletStatus />;
}
```

## Context & Hooks

### WalletContext
Global context for wallet state management.

**Location**: `bitdap-frontend/src/context/WalletContext.tsx`

**Provides**:
- `address`: Connected wallet address (null if disconnected)
- `network`: Current network ('mainnet' | 'testnet')
- `isConnected`: Boolean indicating connection status
- `isConnecting`: Boolean indicating connection in progress
- `connect()`: Function to initiate wallet connection
- `disconnect()`: Function to disconnect wallet
- `switchNetwork()`: Function to switch between networks

**Usage**:
```tsx
import { useWallet } from '@/context/WalletContext';

export function MyComponent() {
  const { address, network, isConnected, connect } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address} on {network}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### useStacksNetwork Hook
Provides the appropriate Stacks network instance.

**Location**: `bitdap-frontend/src/hooks/useStacksNetwork.ts`

**Returns**: `StacksMainnet | StacksTestnet` instance

**Usage**:
```tsx
import { useStacksNetwork } from '@/hooks/useStacksNetwork';

export function MyComponent() {
  const network = useStacksNetwork();
  // Use network for contract calls
}
```

### useContractRead Hook
Hook for reading contract state.

**Location**: `bitdap-frontend/src/hooks/useContractRead.ts`

**Parameters**:
- `contractAddress`: Contract address
- `contractName`: Contract name
- `functionName`: Function to call
- `functionArgs`: Function arguments
- `enabled`: Optional flag to enable/disable execution

**Returns**:
- `data`: Result from contract call
- `isLoading`: Loading state
- `error`: Error if any
- `execute()`: Function to execute the call

**Usage**:
```tsx
import { useContractRead } from '@/hooks/useContractRead';
import { Cl } from '@stacks/transactions';

export function GetCounters() {
  const { data, isLoading, execute } = useContractRead({
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
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

## Storage

### LocalStorage Keys
- `bitdap_wallet_address`: Connected wallet address
- `bitdap_network`: Current network preference
- `stacks_session`: Stacks wallet session data

## Dependencies

### New Dependencies Added
```json
{
  "@stacks/connect": "^7.3.1",
  "@stacks/network": "^7.3.1",
  "@stacks/transactions": "^7.3.1"
}
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd bitdap-frontend
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_BITDAP_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap-token
```

### 3. Install Hiro Wallet
- Download from: https://www.hiro.so/wallet
- Install as browser extension
- Create or import wallet

### 4. Run Development Server
```bash
npm run dev
```

## Usage Flow

1. **User Opens App**: Wallet state loads from localStorage
2. **User Clicks "Connect Wallet"**: Hiro Wallet popup appears
3. **User Approves Connection**: Wallet address and network stored
4. **Address Displayed**: Connected address and network shown
5. **User Can Switch Network**: Dropdown allows mainnet/testnet switch
6. **User Clicks "Disconnect"**: Wallet state cleared

## Network Support

### Testnet
- **Network**: Stacks Testnet
- **Explorer**: https://explorer.hiro.so?chain=testnet
- **API**: https://api.testnet.hiro.so

### Mainnet
- **Network**: Stacks Mainnet
- **Explorer**: https://explorer.hiro.so?chain=mainnet
- **API**: https://api.hiro.so

## Security Considerations

1. **No Private Key Storage**: Private keys never stored locally
2. **Wallet Extension Handles Auth**: All signing delegated to wallet
3. **Session Validation**: Session data validated before use
4. **Network Switching**: Automatic disconnect on network change
5. **Error Handling**: Graceful error handling without exposing sensitive data

## Future Enhancements

- [ ] Multi-wallet support (Leather, Xverse)
- [ ] Transaction signing
- [ ] Contract deployment
- [ ] Token transfers
- [ ] NFT minting/transfers
- [ ] Wallet balance display
- [ ] Transaction history
- [ ] Gas estimation

## Troubleshooting

### Wallet Not Connecting
1. Ensure Hiro Wallet extension is installed
2. Check browser console for errors
3. Try refreshing the page
4. Verify wallet is unlocked

### Wrong Network Displayed
1. Check `NEXT_PUBLIC_STACKS_NETWORK` env variable
2. Verify wallet network matches app network
3. Try switching networks in dropdown

### Address Not Persisting
1. Check browser localStorage is enabled
2. Verify no browser extensions blocking storage
3. Check browser privacy settings

## Testing

### Manual Testing Checklist
- [ ] Connect wallet with Hiro
- [ ] Verify address displays correctly
- [ ] Switch between mainnet/testnet
- [ ] Disconnect wallet
- [ ] Refresh page and verify state persists
- [ ] Test on mobile device
- [ ] Test error scenarios

## Files Modified/Created

### New Files
- `bitdap-frontend/src/context/WalletContext.tsx`
- `bitdap-frontend/src/components/WalletConnect.tsx`
- `bitdap-frontend/src/components/WalletConnect.module.css`
- `bitdap-frontend/src/components/WalletStatus.tsx`
- `bitdap-frontend/src/components/WalletStatus.module.css`
- `bitdap-frontend/src/hooks/useStacksNetwork.ts`
- `bitdap-frontend/src/hooks/useContractRead.ts`

### Modified Files
- `bitdap-frontend/package.json` (added dependencies)
- `bitdap-frontend/app/layout.tsx` (added WalletProvider)
- `bitdap-frontend/app/page.tsx` (added WalletConnect component)
