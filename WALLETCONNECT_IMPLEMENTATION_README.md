# WalletConnect Protocol Implementation Script

This script automates the creation of a complete WalletConnect Protocol integration for the Bitdap frontend with 16 atomic commits.

## What This Script Does

The script creates a new Git branch (`feature/walletconnect-protocol`) and generates 16 commits that implement:

1. **Type Definitions** - TypeScript interfaces for WalletConnect
2. **Utility Functions** - Network config, address validation, formatting
3. **Session Management** - localStorage persistence and expiry handling
4. **Error Handling** - Comprehensive error types and messages
5. **Context & Hooks** - Global state management and React hooks
6. **UI Components** - WalletConnectButton and QRCodeModal
7. **Styling** - CSS modules for responsive design
8. **Dependencies** - Updated package.json with WalletConnect SDK
9. **Configuration** - Environment variable setup
10. **Documentation** - Setup guides and integration examples
11. **Unit Tests** - Tests for utilities and session storage

## Prerequisites

- Git repository initialized
- Node.js 18.17.0 or higher
- npm or yarn
- Clean working directory (no uncommitted changes)

## Usage

### Quick Start

```bash
# Make the script executable
chmod +x walletconnect-implementation.sh

# Run the script
./walletconnect-implementation.sh
```

### What Happens

1. Creates a new branch: `feature/walletconnect-protocol`
2. Creates all necessary files
3. Generates 16 commits with descriptive messages
4. Each commit is atomic and can be reviewed independently

### After Running the Script

```bash
# View the commits
git log --oneline -16

# Review specific commit
git show <commit-hash>

# Install dependencies
cd bitdap-frontend
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your WalletConnect Project ID

# Run tests
npm run test

# Start development
npm run dev
```

## Commit Breakdown

| # | Commit | Purpose |
|---|--------|---------|
| 1 | Add WalletConnect types | Define TypeScript interfaces |
| 2 | Add utility functions | Network config, address helpers |
| 3 | Add session storage | localStorage persistence |
| 4 | Add error handling | Error types and messages |
| 5 | Create WalletConnectContext | Global state management |
| 6 | Create useWalletConnect hook | React hook for context |
| 7 | Create WalletConnectButton | Connection button component |
| 8 | Add button styles | CSS for button component |
| 9 | Create QRCodeModal | QR code display modal |
| 10 | Add modal styles | CSS for modal component |
| 11 | Update package.json | Add WalletConnect dependencies |
| 12 | Create env config | Environment variable setup |
| 13 | Create setup guide | User-facing documentation |
| 14 | Add utility tests | Unit tests for utilities |
| 15 | Add storage tests | Unit tests for session storage |
| 16 | Add integration guide | Developer documentation |

## File Structure Created

```
bitdap-frontend/
├── src/
│   ├── types/
│   │   └── walletconnect.ts
│   ├── utils/
│   │   ├── walletconnect.ts
│   │   ├── session-storage.ts
│   │   ├── error-handler.ts
│   │   └── __tests__/
│   │       ├── walletconnect.test.ts
│   │       └── session-storage.test.ts
│   ├── context/
│   │   └── WalletConnectContext.tsx
│   ├── hooks/
│   │   └── useWalletConnect.ts
│   └── components/
│       ├── WalletConnectButton.tsx
│       ├── WalletConnectButton.module.css
│       ├── QRCodeModal.tsx
│       └── QRCodeModal.module.css
├── .env.example
└── package.json (updated)

Root:
├── WALLETCONNECT_SETUP.md
└── WALLETCONNECT_INTEGRATION.md
```

## Environment Variables

After running the script, create `.env.local` in `bitdap-frontend/`:

```env
# Get your Project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Stacks network configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_BITDAP_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap-token
```

## Testing

The script includes unit tests for core utilities:

```bash
cd bitdap-frontend

# Run all tests
npm run test

# Run specific test file
npm run test -- walletconnect.test.ts

# Run tests in watch mode
npm run test -- --watch
```

## Troubleshooting

### Script fails with "branch already exists"

```bash
# Delete the existing branch
git branch -D feature/walletconnect-protocol

# Run the script again
./walletconnect-implementation.sh
```

### Script fails with "uncommitted changes"

```bash
# Commit or stash your changes
git add .
git commit -m "Your message"

# Run the script again
./walletconnect-implementation.sh
```

### Dependencies installation fails

```bash
cd bitdap-frontend

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Next Steps

1. **Review Commits**: Examine each commit to understand the implementation
2. **Install Dependencies**: Run `npm install` in bitdap-frontend
3. **Configure Environment**: Add your WalletConnect Project ID
4. **Run Tests**: Verify all tests pass
5. **Start Development**: Run `npm run dev`
6. **Integrate with App**: Add WalletConnectProvider to your app layout
7. **Add UI**: Use WalletConnectButton in your components

## Documentation

After running the script, refer to:

- **WALLETCONNECT_SETUP.md** - User setup guide
- **WALLETCONNECT_INTEGRATION.md** - Developer integration guide
- **Code comments** - Inline documentation in source files

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the generated documentation files
3. Check WalletConnect docs: https://docs.walletconnect.com
4. Check Stacks docs: https://docs.stacks.co

## License

This implementation follows the same license as the Bitdap project.
