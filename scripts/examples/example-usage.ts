/**
 * Example Usage of Bitdap Token Interaction Script
 * 
 * This file demonstrates how to use the token interaction script
 * for various operations with the Bitdap Pass NFT contract.
 */

// Example private key (DO NOT use in production)
const EXAMPLE_PRIVATE_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const EXAMPLE_RECIPIENT = "ST1RECIPIENT123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Basic Examples
 */

// 1. Mint a Basic tier NFT
// npm run token-interact mint --tier 1 --private-key YOUR_PRIVATE_KEY

// 2. Mint a Pro tier NFT with metadata
// npm run token-interact mint --tier 2 --uri "https://example.com/metadata.json" --private-key YOUR_PRIVATE_KEY

// 3. Transfer a token
// npm run token-interact transfer --token-id 1 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY

// 4. Query total supply
// npm run token-interact query --type supply

// 5. Get token information
// npm run token-interact query --type token --token-id 1

/**
 * Configuration Examples
 */

// Show current configuration
// npm run token-interact config --action show

// Switch to mainnet
// npm run token-interact config --action set --network mainnet

// Set JSON output format
// npm run token-interact config --action set --output-format json

// Enable verbose output
// npm run token-interact config --action set --verbose true

/**
 * Batch Operation Examples
 */

// Create sample batch files
// npm run token-interact batch --create-sample

// Example JSON batch file content:
const exampleJSONBatch = {
  operations: [
    {
      id: "mint-basic-1",
      command: "mint",
      parameters: {
        tier: 1,
        uri: "https://example.com/metadata/basic-1.json"
      }
    },
    {
      id: "mint-basic-2", 
      command: "mint",
      parameters: {
        tier: 1,
        uri: "https://example.com/metadata/basic-2.json"
      }
    },
    {
      id: "mint-pro-1",
      command: "mint", 
      parameters: {
        tier: 2,
        uri: "https://example.com/metadata/pro-1.json"
      }
    },
    {
      id: "mint-vip-1",
      command: "mint",
      parameters: {
        tier: 3,
        uri: "https://example.com/metadata/vip-1.json"
      }
    },
    {
      id: "transfer-1",
      command: "transfer",
      parameters: {
        "token-id": 1,
        recipient: EXAMPLE_RECIPIENT
      }
    }
  ]
};

// Example CSV batch file content:
const exampleCSVBatch = `command,tier,token-id,recipient,uri
mint,1,,,"https://example.com/metadata/basic-1.json"
mint,1,,,"https://example.com/metadata/basic-2.json"
mint,2,,,"https://example.com/metadata/pro-1.json"
mint,3,,,"https://example.com/metadata/vip-1.json"
transfer,,1,${EXAMPLE_RECIPIENT},`;

/**
 * Advanced Query Examples
 */

// Get all tier information
// npm run token-interact query --type all-tiers

// Get specific tier supply
// npm run token-interact query --type tier-supply --tier 2

// Get contract statistics
// npm run token-interact query --type counters

// Check if contract is paused
// npm run token-interact query --type status

/**
 * Error Handling Examples
 */

// These commands will demonstrate error handling:

// Invalid tier (will show validation error)
// npm run token-interact mint --tier 5 --private-key YOUR_PRIVATE_KEY

// Invalid token ID (will show not found error)
// npm run token-interact query --type token --token-id 99999

// Invalid recipient address (will show validation error)
// npm run token-interact transfer --token-id 1 --recipient INVALID_ADDRESS --private-key YOUR_PRIVATE_KEY

/**
 * Output Format Examples
 */

// JSON output
// npm run token-interact query --type supply
// npm run token-interact config --action set --output-format json
// npm run token-interact query --type supply

// CSV output
// npm run token-interact config --action set --output-format csv
// npm run token-interact query --type all-tiers

// Table output (default)
// npm run token-interact config --action set --output-format table
// npm run token-interact query --type counters

/**
 * Workflow Examples
 */

// Complete NFT minting workflow:
// 1. Check contract status
// npm run token-interact query --type status

// 2. Check current supply
// npm run token-interact query --type supply

// 3. Check tier supply
// npm run token-interact query --type tier-supply --tier 1

// 4. Mint NFT
// npm run token-interact mint --tier 1 --private-key YOUR_PRIVATE_KEY

// 5. Verify mint
// npm run token-interact query --type token --token-id NEW_TOKEN_ID

// Complete transfer workflow:
// 1. Check token ownership
// npm run token-interact query --type owner --token-id 1

// 2. Transfer token
// npm run token-interact transfer --token-id 1 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY

// 3. Verify transfer
// npm run token-interact query --type owner --token-id 1

/**
 * Batch Processing Workflow
 */

// 1. Create batch file
// npm run token-interact batch --create-sample

// 2. Edit batch-sample.json with your operations

// 3. Process batch with rate limiting
// npm run token-interact batch --file batch-sample.json --private-key YOUR_PRIVATE_KEY --delay 2000

// 4. Save results
// npm run token-interact batch --file batch-sample.json --private-key YOUR_PRIVATE_KEY --output batch-results.json

/**
 * Monitoring and Logging
 */

// Enable debug logging
// npm run token-interact config --action set --log-level debug

// Check log files in .bitdap/logs/
// tail -f .bitdap/logs/bitdap-$(date +%Y-%m-%d).log

/**
 * Network Switching Examples
 */

// Switch to testnet
// npm run token-interact config --action set --network testnet --contract-address ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

// Switch to mainnet
// npm run token-interact config --action set --network mainnet --contract-address SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

// Switch to local development
// npm run token-interact config --action set --network local --node-url http://localhost:3999

/**
 * Security Best Practices
 */

// 1. Never hardcode private keys in scripts
// 2. Use environment variables for sensitive data
// 3. Verify recipient addresses before transfers
// 4. Check contract status before operations
// 5. Review transaction details carefully
// 6. Keep private keys secure and backed up

console.log("Example usage file loaded. See comments for command examples.");
console.log("Remember to replace YOUR_PRIVATE_KEY with your actual private key!");
console.log("Never commit private keys to version control!");

export {
  exampleJSONBatch,
  exampleCSVBatch,
  EXAMPLE_PRIVATE_KEY,
  EXAMPLE_RECIPIENT
};