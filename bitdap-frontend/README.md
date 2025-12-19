# Bitdap Frontend

Next.js frontend for the Bitdap Pass NFT collection with Chainhooks integration.

## Features

- ✅ Wallet connection (Hiro Wallet, Xverse, Leather)
- ✅ Mint Bitdap Passes
- ✅ View Pass collection
- ✅ Admin controls (pause/unpause, set-token-uri)
- ✅ **Real-time event tracking via Chainhooks**
- ✅ Event feed showing mints, transfers, and burns

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your contract addresses:

```env
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_BITDAP_CONTRACT=SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap-token
NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so
NEXT_PUBLIC_HIRO_API_BASE=https://api.hiro.so
NEXT_PUBLIC_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Chainhooks Integration

The frontend includes full Chainhooks integration for real-time event tracking:

### Webhook Endpoint

The app exposes a webhook endpoint at `/api/webhooks` that receives events from Hiro Chainhooks.

### Setting Up Chainhooks

1. **Register Chainhooks** (see `chainhooks-quickstart.md` in the root directory):

```bash
# From the root directory
npm run chainhooks:register
```

2. **Configure Webhook URL**:

   - For local development: Use ngrok or similar to expose your local server:
     ```bash
     ngrok http 3000
     ```
     Then set `NEXT_PUBLIC_WEBHOOK_URL` to your ngrok URL.

   - For production: Set `NEXT_PUBLIC_WEBHOOK_URL` to your production webhook endpoint.

3. **Update Chainhooks Registration**:

   Edit `chainhooks.ts` in the root directory to use your webhook URL:

   ```typescript
   const webhookUrl = process.env.WEBHOOK_URL || "https://your-domain.com/api/webhooks";
   ```

### Event Feed

The `EventFeed` component displays real-time events:
- ✨ Mint events
- 🔄 Transfer events  
- 🔥 Burn events

Events are stored client-side in localStorage and updated via webhooks.

## Project Structure

```
bitdap-frontend/
├── app/
│   ├── api/
│   │   └── webhooks/          # Chainhooks webhook endpoints
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── components/
│   │   ├── EventFeed.tsx      # Real-time event display
│   │   ├── MintPass.tsx
│   │   ├── PassList.tsx
│   │   ├── AdminPanel.tsx
│   │   └── WalletButton.tsx
│   ├── config/
│   │   └── contracts.ts       # Contract configuration
│   ├── context/
│   │   └── WalletContext.tsx  # Wallet connection state
│   └── hooks/
│       ├── useBitdapContract.ts
│       ├── useBitdapRead.ts
│       └── useChainhooks.ts    # Chainhooks integration
└── .env.local                  # Environment variables (gitignored)
```

## Testing

### Test Mint Flow

1. Connect wallet
2. Select tier (1, 2, or 3)
3. Optionally add metadata URI
4. Click "Mint Pass"
5. Approve transaction in wallet
6. Event should appear in Event Feed

### Test Admin Functions

1. Connect with admin wallet (deployer address)
2. Use Admin Panel to:
   - Pause/unpause contract
   - Set token URI
3. Verify changes take effect

## Production Deployment

1. Set all environment variables in your hosting platform
2. Ensure webhook URL is publicly accessible
3. Register Chainhooks with production webhook URL
4. Build and deploy:

```bash
npm run build
npm start
```

## Troubleshooting

### Events Not Appearing

- Check that Chainhooks are registered correctly
- Verify webhook URL is accessible
- Check browser console for errors
- Ensure contract addresses are correct

### Wallet Connection Issues

- Ensure you have a Stacks wallet installed (Hiro Wallet, Xverse, or Leather)
- Check network matches your contract deployment (mainnet/testnet)

### Contract Calls Failing

- Verify contract addresses in `.env.local`
- Check network matches contract deployment
- Ensure wallet has sufficient STX for fees
