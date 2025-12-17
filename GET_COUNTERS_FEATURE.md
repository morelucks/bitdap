# Get Counters Feature

## Overview
The `get-counters()` function provides a single-call interface to retrieve all key metrics from the Bitdap Pass contract. This enables efficient off-chain monitoring and analytics without multiple separate calls.

## Functions

### `get-counters() -> (ok tuple)`
Returns all counters in a single response tuple containing:
- **users** (uint) - Total number of unique users who have interacted with the contract
- **listings** (uint) - Total number of active marketplace listings
- **transactions** (uint) - Total number of transactions (mints, transfers, burns)

**Example Response:**
```clarity
(ok (tuple
  (users u42)
  (listings u5)
  (transactions u127)
))
```

### Individual Counter Functions

#### `get-user-count() -> (ok uint)`
Returns the total number of unique users who have minted or received passes.

#### `get-listing-count() -> (ok uint)`
Returns the total number of active marketplace listings.

#### `get-transaction-count() -> (ok uint)`
Returns the total number of transactions (mints, transfers, burns).

## Counter Tracking

### User Count
- Incremented when a new principal mints a pass
- Incremented when a new principal receives a pass via transfer
- Not incremented for duplicate operations by the same user
- Tracks unique principals that have interacted with the contract

### Transaction Count
- Incremented on every mint operation
- Incremented on every transfer operation
- Incremented on every burn operation
- Provides total activity metric

### Listing Count
- Currently initialized to 0
- Reserved for future marketplace functionality
- Can be incremented/decremented by marketplace operations

## Usage Examples

### Get All Counters
```typescript
const { result } = simnet.callReadOnlyFn(
  "bitdap",
  "get-counters",
  [],
  caller
);
// Returns: (ok (tuple (users u10) (listings u0) (transactions u25)))
```

### Get Individual Counters
```typescript
// Get user count
const userCount = simnet.callReadOnlyFn(
  "bitdap",
  "get-user-count",
  [],
  caller
);

// Get transaction count
const txCount = simnet.callReadOnlyFn(
  "bitdap",
  "get-transaction-count",
  [],
  caller
);
```

## Implementation Details

### Data Variables
- `user-count: uint` - Tracks unique users
- `listing-count: uint` - Tracks marketplace listings
- `transaction-count: uint` - Tracks all transactions

### Data Maps
- `user-registry: { user: principal } -> { active: bool }` - Tracks which principals have interacted

### Counter Updates
- **Mint**: Increments user-count (if new), transaction-count
- **Transfer**: Increments user-count (if recipient is new), transaction-count
- **Burn**: Increments transaction-count

## Benefits

1. **Efficiency**: Single call retrieves all metrics instead of three separate calls
2. **Consistency**: All counters are from the same block state
3. **Analytics**: Enables real-time dashboard updates with minimal RPC calls
4. **Scalability**: Reduces network overhead for monitoring applications
5. **Future-Ready**: Listing count reserved for marketplace features

## Test Coverage

Comprehensive tests verify:
- ✅ Counters initialize to zero
- ✅ User count increments on first mint
- ✅ User count doesn't increment on duplicate mints
- ✅ User count increments for different users
- ✅ Transaction count increments on transfer
- ✅ Transaction count increments on burn
- ✅ Individual counter functions work correctly
- ✅ Multiple operations tracked accurately
