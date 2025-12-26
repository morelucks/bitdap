# Bitdap Token Interaction Script

A comprehensive command-line interface for interacting with the Bitdap Pass NFT contract on the Stacks blockchain.

## Features

- 🎫 **Token Operations**: Mint, transfer, and burn Bitdap Pass NFTs
- 🔍 **Contract Queries**: Get token information, supply data, and contract statistics
- ⚙️ **Configuration Management**: Manage network settings, output formats, and logging
- 📦 **Batch Operations**: Execute multiple operations from JSON or CSV files
- 🔐 **Secure Wallet Integration**: Safe private key handling with network validation
- 📊 **Multiple Output Formats**: JSON, table, and CSV output support
- 🚨 **Comprehensive Error Handling**: Detailed error messages with recovery suggestions
- 📝 **Advanced Logging**: Configurable logging with rotation and monitoring
- 🎨 **Colored Output**: Beautiful terminal interface with progress indicators

## Installation

```bash
# Install dependencies
npm install

# Make the script executable
chmod +x scripts/token-interaction.ts
```

## Quick Start

```bash
# Show help
npm run token-interact --help

# Configure for testnet (default)
npm run token-interact config --action show

# Mint a Basic tier NFT
npm run token-interact mint --tier 1 --private-key YOUR_PRIVATE_KEY

# Query total supply
npm run token-interact query --type supply

# Transfer a token
npm run token-interact transfer --token-id 1 --recipient ST1RECIPIENT... --private-key YOUR_PRIVATE_KEY
```

## Commands

### Mint Command

Mint new Bitdap Pass NFTs in different tiers.

```bash
# Mint Basic tier (1)
npm run token-interact mint --tier 1 --private-key YOUR_KEY

# Mint Pro tier (2) with metadata URI
npm run token-interact mint --tier 2 --uri "https://example.com/metadata.json" --private-key YOUR_KEY

# Mint VIP tier (3)
npm run token-interact mint --tier 3 --private-key YOUR_KEY
```

**Tiers:**
- `1` - Basic (Max: 7,000)
- `2` - Pro (Max: 2,500) 
- `3` - VIP (Max: 500)

### Transfer Command

Transfer tokens between addresses.

```bash
# Basic transfer
npm run token-interact transfer --token-id 1 --recipient ST1RECIPIENT... --private-key YOUR_KEY

# Transfer with memo
npm run token-interact transfer --token-id 5 --recipient ST1RECIPIENT... --private-key YOUR_KEY --memo "Gift"
```

### Query Command

Query contract information and token data.

```bash
# Get total supply
npm run token-interact query --type supply

# Get tier-specific supply
npm run token-interact query --type tier-supply --tier 2

# Get token information
npm run token-interact query --type token --token-id 1

# Get token owner
npm run token-interact query --type owner --token-id 5

# Get contract statistics
npm run token-interact query --type counters

# Get all tier information
npm run token-interact query --type all-tiers

# Check contract status
npm run token-interact query --type status
```

### Configuration Command

Manage application settings.

```bash
# Show current configuration
npm run token-interact config --action show

# Set network to mainnet
npm run token-interact config --action set --network mainnet

# Set output format to JSON
npm run token-interact config --action set --output-format json

# Set contract address
npm run token-interact config --action set --contract-address SP1234...

# Reset to defaults
npm run token-interact config --action reset

# Validate configuration
npm run token-interact config --action validate
```

### Batch Command

Execute multiple operations from files.

```bash
# Create sample batch files
npm run token-interact batch --create-sample

# Process JSON batch file
npm run token-interact batch --file operations.json --private-key YOUR_KEY

# Process CSV batch file with custom delay
npm run token-interact batch --file operations.csv --private-key YOUR_KEY --delay 2000

# Save results to file
npm run token-interact batch --file batch.json --private-key YOUR_KEY --output results.json
```

## Batch File Formats

### JSON Format

```json
{
  "operations": [
    {
      "id": "mint-basic-1",
      "command": "mint",
      "parameters": {
        "tier": 1,
        "uri": "https://example.com/metadata/1.json"
      }
    },
    {
      "id": "transfer-1",
      "command": "transfer",
      "parameters": {
        "token-id": 1,
        "recipient": "ST1RECIPIENT..."
      }
    }
  ]
}
```

### CSV Format

```csv
command,tier,token-id,recipient,uri
mint,1,,,"https://example.com/metadata/1.json"
mint,2,,,
transfer,,1,ST1RECIPIENT...,
```

## Configuration

The script stores configuration in `.bitdap/config.json`:

```json
{
  "network": {
    "type": "testnet",
    "nodeUrl": "https://api.testnet.hiro.so",
    "contractAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  },
  "wallet": {
    "type": "software"
  },
  "output": {
    "format": "table",
    "verbose": false,
    "colors": true
  },
  "logging": {
    "level": "info",
    "rotation": true
  }
}
```

## Output Formats

### Table Format (Default)
```
✅ Success
Transaction ID: 0x1234...
┌─────────┬───────────────┐
│ Property│ Value         │
├─────────┼───────────────┤
│ tier    │ 1             │
│ wallet  │ ST1ABC...     │
└─────────┴───────────────┘
```

### JSON Format
```json
{
  "success": true,
  "txId": "0x1234...",
  "data": {
    "tier": 1,
    "wallet": "ST1ABC..."
  }
}
```

### CSV Format
```csv
success,txId,tier,wallet
true,0x1234...,1,ST1ABC...
```

## Error Handling

The script provides detailed error messages with recovery suggestions:

```
❌ Error: Invalid tier specified. Must be 1 (Basic), 2 (Pro), or 3 (VIP)
Code: ERR_INVALID_TIER
Category: validation
💡 Suggestions:
  • Use tier 1 for Basic pass
  • Use tier 2 for Pro pass
  • Use tier 3 for VIP pass
```

## Logging

Logs are stored in `.bitdap/logs/` with automatic rotation:

- `bitdap-YYYY-MM-DD.log` - General application logs
- `bitdap-error-YYYY-MM-DD.log` - Error logs only

Log levels: `debug`, `info`, `warn`, `error`

## Security

- Private keys are never stored or logged
- All sensitive parameters are sanitized in logs
- Network validation ensures wallet compatibility
- Transaction details are displayed before signing

## Network Support

- **Testnet** (default): `https://api.testnet.hiro.so`
- **Mainnet**: `https://api.mainnet.hiro.so`
- **Local**: `http://localhost:3999`

## Troubleshooting

### Common Issues

1. **Invalid Private Key**
   ```bash
   # Ensure key is 64-character hex string
   # Remove '0x' prefix if present
   ```

2. **Network Mismatch**
   ```bash
   # Check wallet address matches network
   # Testnet: ST... addresses
   # Mainnet: SP... addresses
   ```

3. **Contract Paused**
   ```bash
   # Check contract status
   npm run token-interact query --type status
   ```

4. **Insufficient Balance**
   ```bash
   # Ensure wallet has enough STX for fees
   # Check balance on Stacks explorer
   ```

### Getting Help

```bash
# General help
npm run token-interact --help

# Command-specific help
npm run token-interact mint --help
npm run token-interact transfer --help
npm run token-interact query --help
```

## Development

### Project Structure

```
scripts/
├── token-interaction.ts     # Main entry point
├── cli/                     # CLI interface and routing
├── commands/               # Command implementations
├── config/                 # Configuration management
├── contract/               # Contract interface
├── wallet/                 # Wallet integration
├── batch/                  # Batch processing
├── output/                 # Output formatting
├── error/                  # Error handling
├── logging/                # Logging system
└── README.md              # This file
```

### Adding New Commands

1. Create command class in `commands/`
2. Implement `CommandDefinition` interface
3. Register in `cli/cli-interface.ts`
4. Add CLI argument parsing

### Testing

```bash
# Run with sample operations
npm run token-interact batch --create-sample
npm run token-interact batch --file batch-sample.json --private-key YOUR_KEY
```

## License

This project is part of the Bitdap ecosystem. See the main project license for details.