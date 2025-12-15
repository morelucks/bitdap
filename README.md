## Bitdap Pass – Tiered Membership NFT on Stacks

**Bitdap Pass** is a Clarity smart contract that defines a **tiered NFT membership collection** on the Stacks blockchain.
Each NFT represents an access pass that off-chain services or other contracts can use to gate features, communities, or content.

### Concept

- **Collection name**: Bitdap Pass  
- **Type**: Non‑fungible tokens (NFTs), 1 owner per `token-id`  
- **Tiers**:
  - **Basic** – entry‑level membership
  - **Pro** – advanced features / perks
  - **VIP** – premium / exclusive access

The on-chain contract focuses on ownership, tier information, and safe mint/transfer logic.
Frontends, bots, or other services can read these NFTs to decide what to unlock.

### Repository Structure

- `contracts/bitdap.clar` – main Clarity contract for Bitdap Pass  
- `Clarinet.toml` – Clarinet project configuration  
- `settings/*.toml` – network configuration files (Devnet/Testnet/Mainnet)  
- `tests/bitdap.test.ts` – contract test suite (Vitest + Clarinet)  
- `vitest.config.ts`, `tsconfig.json`, `package.json` – TypeScript tooling and test runner config

### Development Prerequisites

- **Node.js** (recommended LTS)  
- **npm** or **yarn**  
- **Clarinet** (Stacks smart contract tooling)

Install Clarinet by following the official documentation (`https://docs.hiro.so/clarity/clarinet`).

Install JavaScript dependencies:

```bash
cd bitdap
npm install
```

### Running Tests

This project uses **Clarinet** plus a **Vitest** test runner.

From the project root:

```bash
# Run Clarinet tests via the JS test suite
npm test

# Or run Vitest directly (if configured in package.json scripts)
npm run test
```

To use Clarinet’s native commands:

```bash
# Check contract semantics / lints
clarinet check

# Run Clarinet test harness (if you add .toml test definitions)
clarinet test
```

### Milestones

The contract is being developed in clear, incremental milestones:

1. **Concept & Rules**  
   - Define collection name (Bitdap Pass), tiers (Basic/Pro/VIP), and high-level behavior.  
2. **Data Model & Storage**  
   - Model `token-id` → owner and tier metadata, supply counters, and admin tracking.  
3. **Core NFT Logic**  
   - Implement minting, transfers, optional burns/revocations, and tier constraints.  
4. **Read-Only Views & Queries**  
   - Add helpers to fetch owner, tier/metadata, and aggregate supply stats.  
5. **Admin & Access Control**  
   - Configure contract owner, mint permissions, and (optionally) pausing minting.  
6. **Events, Errors & UX**  
   - Standardize error codes and logs/events to make off-chain integration easier.  
7. **Testing & Deployment**  
   - Expand tests, verify behavior on devnet, and prepare for testnet/mainnet deployment.

### How to Use Bitdap Pass

- **As a builder**:  
  - Integrate the contract into your dApp, API, or bot by reading holders and tiers.  
  - Gate features (e.g., feature flags, rate limits, premium endpoints) based on tier.

- **As a holder**:  
  - Holding a Bitdap Pass NFT signals your membership tier.  
  - Clients can check your wallet for Bitdap Pass tokens to decide what you can access.

### Roadmap

Upcoming work includes:

- Implementing the full NFT data model and mint/transfer functions.  
- Expanding the test suite in `tests/bitdap.test.ts`.  
- Documenting concrete integration examples for web apps and bots.

Contributions, issues, and suggestions are welcome as the Bitdap Pass contract evolves.


