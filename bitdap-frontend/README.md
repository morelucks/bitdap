# Bitdap Frontend

Full-featured Next.js frontend for interacting with the Bitdap Pass NFT collection on Stacks.

## Features

- 🔗 **Wallet Connection**: Connect with Stacks wallet (Hiro Wallet, Xverse, etc.)
- 🎨 **Mint Passes**: Mint new Bitdap Pass NFTs (Basic, Pro, VIP tiers)
- 📊 **Collection Stats**: View total supply, tier supplies, and next token ID
- 🔄 **Transfer Passes**: Transfer your passes to other addresses
- 🔥 **Burn Passes**: Burn/destroy passes you own
- ⚙️ **Admin Panel**: Pause/unpause contract and update token URIs (contract owner only)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Copy environment template:**
```bash
cp env.example .env.local
```

3. **Configure environment variables in `.env.local`:**
```env
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_BITDAP_CONTRACT=ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.bitdap-token
NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so
NEXT_PUBLIC_HIRO_API_BASE=https://api.hiro.so
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Usage

### Connect Wallet
1. Click "Connect Wallet" in the top right
2. Select your Stacks wallet (Hiro Wallet, Xverse, etc.)
3. Approve the connection request

### Mint a Pass
1. Ensure your wallet is connected
2. Select a tier (Basic, Pro, or VIP)
3. Optionally add a metadata URI
4. Click "Mint Pass"
5. Approve the transaction in your wallet

### Transfer a Pass
1. Enter the token ID of the pass you want to transfer
2. Enter the recipient's Stacks address
3. Click "Transfer"
4. Approve the transaction in your wallet

### Burn a Pass
1. Enter the token ID of the pass you want to burn
2. Confirm the action
3. Click "Burn Pass"
4. Approve the transaction in your wallet

### Admin Functions
- **Pause/Unpause**: Temporarily disable minting and transfers
- **Set Token URI**: Update the metadata URI for a specific token

Note: Admin functions are only available to the contract owner.

## Project Structure

```
bitdap-frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx             # Main page component
│   ├── page.module.css      # Page styles
│   └── globals.css          # Global styles
├── src/
│   ├── components/          # React components
│   │   ├── WalletButton.tsx
│   │   ├── MintPass.tsx
│   │   ├── PassList.tsx
│   │   └── AdminPanel.tsx
│   ├── context/             # React contexts
│   │   └── WalletContext.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useBitdapContract.ts
│   │   └── useBitdapRead.ts
│   └── config/              # Configuration
│       └── contracts.ts
└── package.json
```

## Technologies

- **Next.js 14**: React framework
- **@stacks/connect-react**: Stacks wallet integration
- **@stacks/transactions**: Transaction building and broadcasting
- **@stacks/network**: Network configuration
- **TypeScript**: Type safety
- **CSS Modules**: Scoped styling

## Build for Production

```bash
npm run build
npm start
```

## Notes

- The frontend uses `@stacks/connect-react` for wallet integration
- All contract interactions require wallet approval
- Read-only functions (stats, metadata) don't require transactions
- Admin functions check contract ownership on-chain
