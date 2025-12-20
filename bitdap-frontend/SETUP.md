# Bitdap Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd bitdap-frontend
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your contract addresses:

```env
# Network (mainnet or testnet)
NEXT_PUBLIC_STACKS_NETWORK=mainnet

# Contract Addresses (from your deployment)
NEXT_PUBLIC_BITDAP_CONTRACT=SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap
NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap-token

# API URLs (usually don't need to change)
NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so
NEXT_PUBLIC_HIRO_API_BASE=https://api.hiro.so

# Webhook URL (for Chainhooks)
# For local dev, use ngrok: ngrok http 3000
NEXT_PUBLIC_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing End-to-End

### Test 1: Wallet Connection

1. Click "Connect Wallet"
2. Select your wallet (Hiro Wallet, Xverse, or Leather)
3. Approve connection
4. Verify your address appears

### Test 2: Mint a Pass

1. Ensure wallet is connected
2. Select a tier (1=Basic, 2=Pro, 3=VIP)
3. Optionally add a metadata URI
4. Click "Mint Pass"
5. Approve transaction in wallet
6. Check Event Feed - should show mint event
7. Check Pass Statistics - total supply should increase

### Test 3: View Collection Stats

1. After minting, check "Collection Statistics"
2. Verify:
   - Total Supply increased
   - Tier supply for your tier increased
   - Next Token ID is correct

### Test 4: Transfer Pass

1. Enter a token ID you own
2. Enter recipient address (SP...)
3. Click "Transfer"
4. Approve transaction
5. Check Event Feed - should show transfer event

### Test 5: Admin Functions (if you're deployer)

1. Connect with deployer wallet
2. Use Admin Panel:
   - Click "Pause" - verify contract pauses
   - Try to mint - should fail
   - Click "Unpause" - verify contract unpauses
   - Try to mint - should succeed
   - Set token URI for a token ID
   - Verify URI is updated

### Test 6: Chainhooks Integration

1. **Set up webhook endpoint** (for local dev):
   ```bash
   # In another terminal
   ngrok http 3000
   # Copy the https URL
   ```

2. **Update webhook URL** in `.env.local`:
   ```env
   NEXT_PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhooks
   ```

3. **Register Chainhooks** (from root directory):
   ```bash
   cd ..
   npm run chainhooks:register
   ```

4. **Test webhook**:
   - Mint a new pass
   - Check Event Feed - event should appear automatically
   - Check browser console for webhook calls

## Troubleshooting

### Wallet Won't Connect

- Ensure you have a Stacks wallet installed
- Check browser console for errors
- Try refreshing the page
- Clear browser cache

### Contract Calls Fail

- Verify contract addresses in `.env.local` are correct
- Check network matches (mainnet vs testnet)
- Ensure wallet has sufficient STX for fees
- Check contract is not paused (if you're not admin)

### Events Not Appearing

- Check Chainhooks are registered correctly
- Verify webhook URL is accessible
- Check browser console for errors
- Events are stored in localStorage - check DevTools

### Build Errors

- Run `npm install` again
- Delete `node_modules` and `.next` folders
- Run `npm install` and `npm run dev`

## Production Deployment

1. Set all environment variables in your hosting platform
2. Build the app:
   ```bash
   npm run build
   ```

3. Ensure webhook URL is publicly accessible
4. Register Chainhooks with production webhook URL
5. Deploy and start:
   ```bash
   npm start
   ```

## Next Steps

- [ ] Set up production webhook endpoint
- [ ] Register Chainhooks for production
- [ ] Add database for event storage (optional)
- [ ] Add user authentication (optional)
- [ ] Add marketplace features (optional)
