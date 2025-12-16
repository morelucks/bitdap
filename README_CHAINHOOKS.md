# Chainhooks Integration for Bitdap Pass

This guide explains how to use chainhooks to track Bitdap Pass events on the Stacks blockchain.

## Overview

Chainhooks allow you to monitor blockchain events and trigger actions based on them. For Bitdap Pass, we track three types of events:

- **mint-event**: When a new pass is minted
- **transfer-event**: When a pass is transferred between users
- **burn-event**: When a pass is burned/destroyed

## Installation

The chainhooks client is already installed:

```bash
npm install @hirosystems/chainhooks-client
```

## Setup

1. **Set environment variables:**

```bash
# .env file
CHAINHOOK_API_URL=https://api.testnet.hiro.so  # or mainnet URL
CHAINHOOK_API_KEY=your_api_key_here
BITDAP_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap
WEBHOOK_URL=http://localhost:3000/webhook
```

2. **Register hooks:**

```typescript
import { registerAllHooks } from "./chainhooks";

const contractAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap";
await registerAllHooks(contractAddress);
```

## Event Structure

### Mint Event
```json
{
  "event": "mint-event",
  "token-id": 1,
  "owner": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  "tier": 1
}
```

### Transfer Event
```json
{
  "event": "transfer-event",
  "token-id": 1,
  "from": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  "to": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
}
```

### Burn Event
```json
{
  "event": "burn-event",
  "token-id": 1,
  "owner": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  "tier": 2
}
```

## Webhook Handler Example

See `chainhooks.example.ts` for a complete example of handling webhooks.

## Usage

1. **Register hooks** (one-time setup):
```bash
npx tsx chainhooks.ts
```

2. **Set up webhook server** to receive events

3. **Process events** as they arrive

## Resources

- [Chainhooks Documentation](https://docs.hiro.so/chainhooks)
- [Chainhooks Client GitHub](https://github.com/hirosystems/chainhook-2.0)
- [Stacks API](https://docs.hiro.so/stacks-blockchain-api)

