# Contract Explorer Feature

## Overview
This feature provides a comprehensive interface for displaying smart contract addresses and direct links to the Hiro Explorer. Users can easily view contract details, copy addresses, and navigate to the blockchain explorer.

## Features

### 1. Contract Information Display
- ✅ Contract names and descriptions
- ✅ Full contract addresses
- ✅ Contract type badges (NFT/Token)
- ✅ Available functions list
- ✅ Network information

### 2. Explorer Integration
- ✅ Direct links to Hiro Explorer
- ✅ Network-aware URLs (Mainnet/Testnet)
- ✅ One-click navigation to contract details
- ✅ External link indicators

### 3. User-Friendly Features
- ✅ Copy-to-clipboard functionality
- ✅ Truncated address display with full address on hover
- ✅ Expandable contract details
- ✅ Responsive mobile design
- ✅ Smooth animations and transitions

## Components

### ContractInfo Component
Main component for displaying contract overview with Explorer links.

**Location**: `bitdap-frontend/src/components/ContractInfo.tsx`

**Features**:
- Grid layout for multiple contracts
- Network badge display
- Copy address button
- Direct Explorer links
- Network information section

**Usage**:
```tsx
import { ContractInfo } from '@/components/ContractInfo';

export default function Page() {
  return <ContractInfo />;
}
```

### ContractDetails Component
Detailed expandable view of contract information.

**Location**: `bitdap-frontend/src/components/ContractDetails.tsx`

**Features**:
- Expandable contract sections
- Function list display
- Copy address functionality
- Help section with usage tips
- Smooth animations

**Usage**:
```tsx
import { ContractDetails } from '@/components/ContractDetails';

export default function Page() {
  return <ContractDetails />;
}
```

## Contract Information

### Bitdap Pass (NFT Contract)
- **Type**: Non-Fungible Token
- **Address**: Configured via `NEXT_PUBLIC_BITDAP_CONTRACT`
- **Functions**:
  - `mint-pass(tier, uri)` - Mint new pass
  - `transfer(token-id, recipient)` - Transfer pass
  - `burn(token-id)` - Burn pass
  - `get-owner(token-id)` - Get token owner
  - `get-tier(token-id)` - Get tier information
  - `get-counters()` - Get contract counters
  - `get-total-supply()` - Get total supply

### Bitdap Token (Fungible Token)
- **Type**: Fungible Token (SIP-010)
- **Address**: Configured via `NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT`
- **Functions**:
  - `transfer(amount, sender, recipient, memo)` - Transfer tokens
  - `approve(spender, amount)` - Approve spending
  - `transfer-from(owner, recipient, amount, memo)` - Transfer from approved
  - `mint(recipient, amount)` - Mint tokens
  - `burn(amount)` - Burn tokens
  - `get-balance(account)` - Get account balance
  - `get-total-supply()` - Get total supply

## Explorer Links

### Hiro Explorer
- **Mainnet**: https://explorer.hiro.so
- **Testnet**: https://explorer.hiro.so?chain=testnet

### API Endpoints
- **Mainnet API**: https://api.hiro.so
- **Testnet API**: https://api.testnet.hiro.so

## Usage Examples

### Display Contract Information
```tsx
import { ContractInfo } from '@/components/ContractInfo';

export default function ContractsPage() {
  return (
    <div>
      <h1>Smart Contracts</h1>
      <ContractInfo />
    </div>
  );
}
```

### Show Detailed Contract Information
```tsx
import { ContractDetails } from '@/components/ContractDetails';

export default function DetailsPage() {
  return (
    <div>
      <h1>Contract Details</h1>
      <ContractDetails />
    </div>
  );
}
```

### Copy Contract Address
```tsx
const copyAddress = (address: string) => {
  navigator.clipboard.writeText(address);
};

// Usage
<button onClick={() => copyAddress(contractAddress)}>
  Copy Address
</button>
```

### Navigate to Explorer
```tsx
const openInExplorer = (explorerUrl: string) => {
  window.open(explorerUrl, '_blank');
};

// Usage
<a href={explorerUrl} target="_blank" rel="noopener noreferrer">
  View on Explorer
</a>
```

## Environment Configuration

### Required Environment Variables
```env
NEXT_PUBLIC_BITDAP_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap-token
NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so
NEXT_PUBLIC_HIRO_API_BASE=https://api.hiro.so
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

## Styling

### CSS Modules
- `ContractInfo.module.css` - Main contract info styles
- `ContractDetails.module.css` - Detailed view styles

### Design Features
- Gradient backgrounds
- Smooth transitions
- Responsive grid layout
- Mobile-friendly design
- Accessible color contrast
- Hover effects and animations

## Network Support

### Mainnet
- Full contract addresses on mainnet
- Links to mainnet explorer
- Mainnet API endpoints

### Testnet
- Full contract addresses on testnet
- Links to testnet explorer
- Testnet API endpoints

## Accessibility

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Responsive design for all screen sizes

## Performance

- ✅ Minimal re-renders
- ✅ Efficient CSS with modules
- ✅ Optimized images and icons
- ✅ Fast copy-to-clipboard
- ✅ Smooth animations with CSS

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Integration Points

### With Wallet Context
- Network-aware contract display
- Dynamic explorer URLs based on network
- Network switching support

### With Contract Config
- Centralized contract configuration
- Environment variable support
- Easy contract updates

## Future Enhancements

- [ ] Contract ABI display
- [ ] Function parameter documentation
- [ ] Transaction history
- [ ] Contract verification status
- [ ] Gas estimation
- [ ] Multi-contract support
- [ ] Contract interaction UI
- [ ] Event log viewer

## Troubleshooting

### Contract Address Not Displaying
1. Check environment variables are set correctly
2. Verify contract addresses are valid
3. Check browser console for errors

### Explorer Links Not Working
1. Verify network is correct (Mainnet/Testnet)
2. Check explorer base URL in config
3. Ensure contract address is valid

### Copy Button Not Working
1. Check browser supports clipboard API
2. Verify HTTPS connection (required for clipboard)
3. Check browser permissions

## Files Created

### Components
- `bitdap-frontend/src/components/ContractInfo.tsx`
- `bitdap-frontend/src/components/ContractInfo.module.css`
- `bitdap-frontend/src/components/ContractDetails.tsx`
- `bitdap-frontend/src/components/ContractDetails.module.css`

### Documentation
- `CONTRACT_EXPLORER_FEATURE.md` (this file)

### Modified Files
- `bitdap-frontend/app/page.tsx` - Integrated ContractInfo component

## Summary

The Contract Explorer feature provides a complete solution for displaying smart contract information with direct links to the Hiro Explorer. It's production-ready with comprehensive documentation, responsive design, and excellent user experience.
