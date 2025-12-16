# Chainhooks Quickstart (Bitdap)

This is a minimal, step-by-step guide to register chainhooks for Bitdap events (mint / transfer / burn).

## Prerequisites
- `npm install` (already done in the repo)
- Set environment variables:
  - `CHAINHOOK_API_URL` (e.g., `https://api.testnet.hiro.so` or `https://api.hiro.so`)
  - `CHAINHOOK_API_KEY` (if required by your endpoint)
  - `BITDAP_CONTRACT_ADDRESS` (e.g., `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.bitdap`)
  - `WEBHOOK_URL` (where you want to receive events)

## Register hooks (one-liner)
```bash
npm run chainhooks:register
```

## What it does
- Registers three hooks via `chainhooks.ts`:
  - **mint-event** when a Bitdap pass is minted
  - **transfer-event** when a Bitdap pass changes ownership
  - **burn-event** when a Bitdap pass is burned
- Sends events to your `WEBHOOK_URL` with HTTP POST.

## Test your webhook locally
- You can use a tool like `ngrok` or `localtunnel` to expose a local server:
  ```bash
  # example with localtunnel
  npx localtunnel --port 3000 --subdomain bitdap-hooks
  # set WEBHOOK_URL to the tunnel URL, e.g., https://bitdap-hooks.loca.lt/webhook
  ```

## Payload shape (print events)
Events originate from `print` statements in the Clarity contract. Example mint payload:
```json
{
  "event": "mint-event",
  "token-id": 1,
  "owner": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  "tier": 2
}
```

## Files
- `chainhooks.ts` — hook registration + payload parsing helpers
- `chainhooks.example.ts` — sample webhook handler (Express-style)
- `README_CHAINHOOKS.md` — full documentation
- `chainhooks-quickstart.md` — this concise guide


