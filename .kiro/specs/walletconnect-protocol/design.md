# WalletConnect Protocol Integration - Design

## Overview

The WalletConnect Protocol integration provides a universal wallet connection mechanism for Bitdap. It enables users to connect wallets via QR code scanning, supporting mobile wallets, hardware wallets, and alternative desktop wallets. The implementation uses WalletConnect v2 SDK and integrates seamlessly with the existing Hiro Wallet connection system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Bitdap Frontend                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WalletConnectContext (Global State)          │  │
│  │  - Session management                               │  │
│  │  - Network configuration                            │  │
│  │  - Connection status                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      WalletConnectProvider (Context Provider)        │  │
│  │  - Initializes WalletConnect client                 │  │
│  │  - Manages session lifecycle                        │  │
│  │  - Handles network switching                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           UI Components & Hooks                      │  │
│  │  - WalletConnectButton                              │  │
│  │  - QRCodeModal                                      │  │
│  │  - useWalletConnect hook                            │  │
│  │  - useWalletConnectSign hook                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        WalletConnect SDK (External)                 │  │
│  │  - @walletconnect/web3wallet                        │  │
│  │  - @walletconnect/utils                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Wallets   │
                    │  (Mobile,   │
                    │ Hardware,   │
                    │  Desktop)   │
                    └─────────────┘
```

## Components and Interfaces

### WalletConnectContext

Global context for WalletConnect state management.

```typescript
interface WalletConnectContextType {
  // Connection state
  isConnected: boolean;
  address: string | null;
  chainId: number;
  
  // Session management
  session: ISession | null;
  isConnecting: boolean;
  error: string | null;
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (network: 'mainnet' | 'testnet') => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<string>;
  
  // UI state
  showQRCode: boolean;
  qrCodeUri: string | null;
}
```

### WalletConnectProvider

Provider component that initializes and manages WalletConnect client.

**Location**: `bitdap-frontend/src/context/WalletConnectContext.tsx`

**Responsibilities**:
- Initialize WalletConnect client with Project ID
- Manage session lifecycle (create, restore, delete)
- Handle network switching
- Manage error states
- Persist session to localStorage

### WalletConnectButton Component

Button component for initiating WalletConnect connection.

**Location**: `bitdap-frontend/src/components/WalletConnectButton.tsx`

**Props**:
- `variant`: 'primary' | 'secondary' (optional)
- `size`: 'sm' | 'md' | 'lg' (optional)
- `onConnect`: Callback when connection succeeds
- `onError`: Callback when connection fails

### QRCodeModal Component

Modal displaying QR code for wallet scanning.

**Location**: `bitdap-frontend/src/components/QRCodeModal.tsx`

**Props**:
- `isOpen`: Boolean to control modal visibility
- `uri`: WalletConnect URI for QR code
- `onClose`: Callback when modal closes
- `onTimeout`: Callback when connection times out

**Features**:
- Displays QR code using qrcode.react library
- Shows connection URI as text fallback
- Copy to clipboard functionality
- Timeout handling (30 seconds)
- Mobile-optimized display

### useWalletConnect Hook

Custom hook for accessing WalletConnect context.

**Location**: `bitdap-frontend/src/hooks/useWalletConnect.ts`

**Returns**:
```typescript
{
  isConnected: boolean;
  address: string | null;
  chainId: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (network: 'mainnet' | 'testnet') => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}
```

### useWalletConnectSign Hook

Custom hook for signing transactions.

**Location**: `bitdap-frontend/src/hooks/useWalletConnectSign.ts`

**Parameters**:
- `transaction`: Transaction object to sign

**Returns**:
```typescript
{
  sign: () => Promise<string>;
  isLoading: boolean;
  error: string | null;
}
```

## Data Models

### Session Storage

```typescript
interface StoredSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  expiry: number;
  namespaces: {
    [key: string]: {
      chains: string[];
      methods: string[];
      events: string[];
      accounts: string[];
    };
  };
  requiredNamespaces: {
    [key: string]: {
      chains: string[];
      methods: string[];
      events: string[];
    };
  };
  optionalNamespaces?: {
    [key: string]: {
      chains: string[];
      methods: string[];
      events: string[];
    };
  };
  controller: string;
  expiry: number;
  topic: string;
  acknowledged: boolean;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
}
```

### Network Configuration

```typescript
interface NetworkConfig {
  network: 'mainnet' | 'testnet';
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  namespace: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Session Persistence Round Trip
*For any* established WalletConnect session, storing it to localStorage and then restoring it should result in an equivalent session with the same topic, accounts, and network configuration.
**Validates: Requirements 3.1, 3.2**

### Property 2: Network Switch Disconnects Previous Session
*For any* connected wallet session, switching networks should result in the previous session being disconnected and a new session being required.
**Validates: Requirements 6.2, 6.3**

### Property 3: Address Consistency After Connection
*For any* successful wallet connection, the address returned by WalletConnect should match the address displayed in the UI and stored in context.
**Validates: Requirements 2.3, 8.2**

### Property 4: QR Code Modal Cancellation
*For any* open QR code modal, clicking cancel should close the modal and abort the pending connection attempt without establishing a session.
**Validates: Requirements 2.4, 7.4**

### Property 5: Error State Clears on Successful Connection
*For any* error state in the WalletConnect context, successfully connecting a wallet should clear the error state.
**Validates: Requirements 7.1, 7.2**

### Property 6: Session Expiry Triggers Disconnect
*For any* WalletConnect session that reaches its expiry time, the system should automatically disconnect and clear session data.
**Validates: Requirements 3.4**

### Property 7: Transaction Signing Requires Connected Wallet
*For any* transaction signing request, if no wallet is connected, the system should reject the request with an appropriate error.
**Validates: Requirements 5.1**

### Property 8: Mobile Responsive Layout
*For any* viewport width below 768px, the QR code modal should display at an appropriate size and the wallet UI should adapt to mobile layout.
**Validates: Requirements 9.1, 9.2**

## Error Handling

### Connection Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| `CONNECTION_TIMEOUT` | Wallet didn't respond within 30 seconds | Show retry button |
| `INVALID_PROJECT_ID` | WalletConnect Project ID is invalid | Check environment variables |
| `NETWORK_MISMATCH` | Wallet is on different network | Show network switch prompt |
| `SESSION_REJECTED` | User rejected connection in wallet | Show error and allow retry |
| `STORAGE_ERROR` | localStorage is unavailable | Continue without persistence |

### Transaction Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| `SIGNING_FAILED` | Wallet rejected transaction | Show error and allow retry |
| `BROADCAST_FAILED` | Network error broadcasting transaction | Show retry button |
| `INVALID_TRANSACTION` | Transaction format is invalid | Show validation error |

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

- Test WalletConnect context initialization with valid/invalid Project ID
- Test session storage and retrieval from localStorage
- Test network switching logic
- Test error state management
- Test address truncation and formatting
- Test QR code modal open/close behavior
- Test timeout handling

### Property-Based Testing

Property-based tests verify universal properties using fast-check:

- **Property 1**: Session persistence round trip (serialize → deserialize → compare)
- **Property 2**: Network switch always disconnects previous session
- **Property 3**: Address consistency across connection lifecycle
- **Property 4**: QR modal cancellation prevents session establishment
- **Property 5**: Error state clears on successful connection
- **Property 6**: Session expiry triggers automatic disconnect
- **Property 7**: Transaction signing requires connected wallet
- **Property 8**: Mobile responsive layout adapts correctly

### Integration Testing

Integration tests verify component interactions:

- Test WalletConnectButton → QRCodeModal → Session establishment flow
- Test wallet connection → contract interaction flow
- Test network switching with active session
- Test session restoration on page reload
- Test error recovery flows

## Dependencies

### New Dependencies

```json
{
  "@walletconnect/web3wallet": "^1.10.0",
  "@walletconnect/utils": "^2.10.0",
  "@walletconnect/types": "^2.10.0",
  "qrcode.react": "^1.0.1"
}
```

### Environment Variables

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

## File Structure

```
bitdap-frontend/src/
├── context/
│   ├── WalletConnectContext.tsx
│   └── WalletConnectProvider.tsx
├── components/
│   ├── WalletConnectButton.tsx
│   ├── WalletConnectButton.module.css
│   ├── QRCodeModal.tsx
│   ├── QRCodeModal.module.css
│   ├── WalletSelector.tsx
│   └── WalletSelector.module.css
├── hooks/
│   ├── useWalletConnect.ts
│   ├── useWalletConnectSign.ts
│   └── useWalletConnectSession.ts
├── utils/
│   ├── walletconnect.ts
│   ├── session-storage.ts
│   └── error-handler.ts
└── types/
    └── walletconnect.ts
```
