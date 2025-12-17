# Bitdap Frontend Scaffold

Minimal Next.js app to surface Bitdap contract metadata and explorer links.

## Setup
1) Install dependencies
```
npm install
```

2) Copy env template and fill real values
```
cp env.example .env.local
```
- `NEXT_PUBLIC_STACKS_NETWORK`: `mainnet` or `testnet`
- `NEXT_PUBLIC_BITDAP_CONTRACT`: Bitdap contract address (e.g., `SP...bitdap`)
- `NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT`: bitdap-token contract address
- `NEXT_PUBLIC_HIRO_EXPLORER_BASE`: usually `https://explorer.hiro.so`
- `NEXT_PUBLIC_HIRO_API_BASE`: usually `https://api.hiro.so`

3) Run the dev server
```
npm run dev
```

## Notes
- This scaffold is read-only: it shows contract addresses and explorer links.
- Extend `src/config/contracts.ts` if you add more networks or contracts.

