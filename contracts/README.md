# Bitdap NFT Collection Contract v2.0.0

## Overview

The Bitdap NFT Collection Contract is a comprehensive, SIP-009 compliant smart contract that enables the creation and management of NFT collections on the Stacks blockchain. This enhanced version includes advanced features for secure transfers, batch operations, and comprehensive event logging.

## Key Features

### ✅ Core NFT Operations
- **Minting**: Create new NFTs with payment validation
- **Burning**: Permanently destroy NFTs with cleanup
- **Transfers**: Secure token transfers with approval system
- **Batch Operations**: Efficient bulk operations for minting, transfers, and burning

### ✅ Advanced Security
- **Approval System**: Token-specific and operator approvals
- **Access Control**: Owner-only administrative functions
- **Pause Controls**: Emergency pause functionality
- **Validation**: Comprehensive input validation and error handling

### ✅ Enhanced Events
- **Comprehensive Logging**: Detailed events for all operations
- **Success/Failure Events**: Separate events for operation outcomes
- **Transparency**: Full audit trail for all contract interactions

### ✅ Fund Management
- **Payment Validation**: STX payment processing for minting
- **Fund Withdrawal**: Owner can withdraw accumulated fees
- **Balance Queries**: Check contract balance and financial status

### ✅ SIP-009 Compliance
- **Standard Interface**: Full SIP-009 NFT standard implementation
- **Metadata Support**: URI-based metadata system
- **Transfer Compatibility**: Compatible with existing NFT infrastructure

## Contract Functions

### Public Functions

#### Minting
- `mint(recipient, uri)` - Mint new NFT with payment
- `safe-mint(recipient, uri)` - Mint with comprehensive validation
- `batch-mint(recipients)` - Mint multiple NFTs efficiently
- `mint-with-events(recipient, uri)` - Mint with enhanced event logging

#### Transfers
- `transfer(token-id, sender, recipient)` - Basic transfer
- `transfer-from(token-id, sender, recipient)` - Transfer with approval support
- `transfer-memo(token-id, sender, recipient, memo)` - Transfer with memo
- `batch-transfer(transfers)` - Batch transfer operations

#### Approvals
- `approve(token-id, approved)` - Approve operator for specific token
- `set-approval-for-all(operator, approved)` - Set operator for all tokens

#### Burning
- `burn(token-id)` - Burn owned NFT
- `burn-with-events(token-id)` - Burn with enhanced events
- `batch-burn(token-ids)` - Batch burn operations

#### Administrative
- `set-collection-metadata(name, symbol, uri, description)` - Update collection info
- `set-mint-price(price)` - Configure minting cost
- `set-per-address-limit(limit)` - Set minting limits
- `pause-contract()` / `unpause-contract()` - Pause controls
- `emergency-pause(reason)` - Emergency pause with reason
- `transfer-ownership(new-owner)` - Transfer contract ownership
- `withdraw-funds(amount)` - Withdraw accumulated fees
- `withdraw-all-funds()` - Withdraw all contract funds

#### Royalties
- `set-royalty-info(recipient, percentage)` - Configure royalties
- `calculate-royalty(sale-price)` - Calculate royalty amounts
- `record-royalty-payment(amount)` - Record royalty payments

### Read-Only Functions

#### Token Queries
- `get-owner(token-id)` - Get token owner
- `get-token-uri(token-id)` - Get token metadata URI
- `get-approved(token-id)` - Get approved operator for token
- `get-token-info-detailed(token-id)` - Comprehensive token info
- `get-tokens-info-detailed(token-ids)` - Batch token queries

#### Collection Info
- `get-collection-info()` - Complete collection information
- `get-mint-info()` - Current minting parameters
- `get-contract-status()` - Contract operational status
- `get-royalty-info()` - Royalty configuration
- `get-contract-balance()` - Contract STX balance

#### Approval Queries
- `is-approved-for-all-query(owner, operator)` - Check operator approval
- `get-batch-operation-limits()` - Batch operation limits

## Error Codes

- `ERR-UNAUTHORIZED (401)` - Unauthorized access
- `ERR-NOT-FOUND (404)` - Token not found
- `ERR-INVALID-AMOUNT (400)` - Invalid amount parameter
- `ERR-INSUFFICIENT-PAYMENT (402)` - Insufficient payment
- `ERR-MINT-LIMIT-EXCEEDED (403)` - Per-address mint limit exceeded
- `ERR-MAX-SUPPLY-REACHED (405)` - Maximum supply reached
- `ERR-CONTRACT-PAUSED (406)` - Contract is paused
- `ERR-SELF-TRANSFER (407)` - Self-transfer attempted
- `ERR-INVALID-ROYALTY (408)` - Invalid royalty percentage
- `ERR-INVALID-RECIPIENT (409)` - Invalid recipient address
- `ERR-TOKEN-EXISTS (410)` - Token already exists
- `ERR-MINTING-DISABLED (411)` - Minting is disabled
- `ERR-INVALID-TOKEN-ID (412)` - Invalid token ID
- `ERR-BATCH-LIMIT-EXCEEDED (413)` - Batch operation limit exceeded
- `ERR-INVALID-METADATA (414)` - Invalid metadata format
- `ERR-TRANSFER-FAILED (415)` - Transfer operation failed

## Usage Examples

### Basic Minting
```clarity
;; Mint a new NFT to a recipient
(contract-call? .bitdap-nft-collection mint 'SP1234... (some u"https://metadata.uri"))
```

### Batch Operations
```clarity
;; Batch mint multiple NFTs
(contract-call? .bitdap-nft-collection batch-mint 
  (list 
    { recipient: 'SP1234..., uri: (some u"uri1") }
    { recipient: 'SP5678..., uri: (some u"uri2") }
  )
)
```

### Approval and Transfer
```clarity
;; Approve operator for token
(contract-call? .bitdap-nft-collection approve u1 'SP-OPERATOR...)

;; Transfer using approval
(contract-call? .bitdap-nft-collection transfer-from u1 'SP-OWNER... 'SP-RECIPIENT...)
```

## Deployment

1. Deploy the contract to Stacks blockchain
2. Configure collection metadata using `set-collection-metadata`
3. Set minting parameters with `set-mint-price` and `set-per-address-limit`
4. Configure royalties if needed with `set-royalty-info`
5. Enable minting and start operations

## Security Considerations

- Always validate inputs before operations
- Use pause functionality in emergency situations
- Regularly withdraw accumulated funds
- Monitor approval grants and revoke when necessary
- Keep track of batch operation limits to prevent gas issues

## Version History

- **v1.0.0**: Initial implementation with basic NFT functionality
- **v2.0.0**: Enhanced version with approvals, events, batch operations, and fund management

## License

This contract is part of the Bitdap ecosystem and follows the project's licensing terms.