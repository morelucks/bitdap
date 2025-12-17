# Admin Management & Marketplace Pause Controls

## Overview
This feature adds comprehensive admin management and marketplace pause/unpause functionality to the Bitdap Pass NFT contract.

## New Functions

### Admin Management

#### `set-admin(new-admin: principal) -> (ok bool) | (err uint)`
- Transfers admin rights to a new principal
- Only callable by current admin
- Emits `admin-changed` event with old and new admin addresses
- Error: `ERR-UNAUTHORIZED (u106)` if caller is not admin

#### `transfer-admin(new-admin: principal) -> (ok bool) | (err uint)`
- Alias for `set-admin`
- Provides alternative naming for admin transfer
- Same behavior and permissions as `set-admin`

#### `get-admin() -> (ok principal)`
- Read-only function to retrieve current admin address
- Can be called by anyone

### Marketplace Controls

#### `pause-marketplace() -> (ok bool) | (err uint)`
- Pauses all marketplace operations (minting)
- Only callable by admin
- Blocks `mint-pass` function when active
- Emits `marketplace-paused` event
- Error: `ERR-UNAUTHORIZED (u106)` if caller is not admin

#### `unpause-marketplace() -> (ok bool) | (err uint)`
- Resumes marketplace operations
- Only callable by admin
- Re-enables `mint-pass` function
- Emits `marketplace-unpaused` event
- Error: `ERR-UNAUTHORIZED (u106)` if caller is not admin

#### `is-marketplace-paused() -> (ok bool)`
- Read-only function to check marketplace pause status
- Returns `true` if marketplace is paused, `false` otherwise
- Can be called by anyone

## Implementation Details

### Data Variables
- `marketplace-paused: bool` - Tracks marketplace pause state (default: false)

### Contract Behavior
- When marketplace is paused, `mint-pass` returns `ERR-PAUSED (u107)`
- Marketplace pause is independent of the general contract pause
- Both pause states must be checked for minting to succeed

### Events
- `admin-changed`: Emitted when admin is transferred
  - Fields: `event`, `old-admin`, `new-admin`
- `marketplace-paused`: Emitted when marketplace is paused
  - Fields: `event`, `admin`
- `marketplace-unpaused`: Emitted when marketplace is unpaused
  - Fields: `event`, `admin`

## Test Coverage
Comprehensive tests added in `tests/bitdap.test.ts`:
- Admin transfer functionality
- Admin authorization checks
- Marketplace pause/unpause operations
- Marketplace pause blocking minting
- Event emission verification
- Non-admin rejection

## Usage Examples

### Transfer Admin Rights
```clarity
(contract-call? .bitdap set-admin 'SP2EXAMPLE123456789)
```

### Pause Marketplace
```clarity
(contract-call? .bitdap pause-marketplace)
```

### Check Marketplace Status
```clarity
(contract-call? .bitdap is-marketplace-paused)
```

### Get Current Admin
```clarity
(contract-call? .bitdap get-admin)
```

## Security Considerations
- Admin functions are protected by `assert-admin` check
- Only current admin can transfer admin rights
- Marketplace pause is independent of general pause for flexibility
- All admin actions emit events for off-chain tracking
