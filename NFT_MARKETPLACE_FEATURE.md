# NFT Marketplace Feature - Complete Implementation

## Overview

The Bitdap Pass NFT Marketplace is a complete decentralized marketplace for buying, selling, and trading Bitdap Pass NFTs on the Stacks blockchain. It includes smart contract functions, comprehensive frontend components, and analytics capabilities.

## Architecture

### Smart Contract Layer

The marketplace is implemented in Clarity with the following key components:

#### Data Structures

- **marketplace-listings**: Stores active and inactive listings
- **purchase-history**: Tracks all purchases for analytics
- **seller-listings**: Maps sellers to their listings for efficient querying
- **Marketplace fee configuration**: Admin-controlled fee settings

#### Core Functions

##### Listing Management

```clarity
(create-listing (token-id uint) (price uint) (expiry-blocks uint))
```
- Creates a new marketplace listing
- Only token owner can create listing
- Price must be > 0
- Emits `listing-created` event

```clarity
(update-listing-price (listing-id uint) (new-price uint))
```
- Updates price of existing listing
- Only seller can update
- Price must be > 0

```clarity
(cancel-listing (listing-id uint))
```
- Cancels active listing
- Only seller can cancel
- Decrements listing counter

##### Purchase Operations

```clarity
(purchase-listing (listing-id uint))
```
- Purchases active listing
- Transfers token to buyer
- Deducts marketplace fees
- Records purchase history
- Emits `purchase-completed` event

##### Fee Management

```clarity
(set-marketplace-fee (fee-percent uint))
```
- Admin function to set fee percentage (max 10%)
- Emits `marketplace-fee-updated` event

```clarity
(set-fee-recipient (recipient principal))
```
- Admin function to set fee recipient
- Emits `fee-recipient-updated` event

```clarity
(get-marketplace-fee-info)
```
- Returns current fee configuration and total fees collected

#### Read-Only Functions

```clarity
(get-listing (listing-id uint))
```
Returns complete listing details

```clarity
(get-seller-listings (seller principal))
```
Returns list of seller's listings

```clarity
(get-purchase-history (buyer principal) (listing-id uint))
```
Returns purchase record for buyer

```clarity
(is-listing-active (listing-id uint))
```
Checks if listing is active

### Frontend Layer

#### Components

##### MarketplaceListings
- Displays all active listings in a responsive grid
- Filter options: all, active, my-listings
- Shows listing details: token ID, price, seller, status
- Action buttons: buy, edit price, cancel

##### CreateListing
- Form for creating new listings
- Validates token ID, price, and expiry blocks
- Shows preview of listing details
- Integrates with wallet for seller verification

##### PurchaseModal
- Confirmation modal for purchases
- Shows fee breakdown
- Displays total amount to pay
- Handles transaction signing

##### MarketplaceStats
- Displays marketplace metrics
- Time-range filtering (24h, 7d, 30d, all-time)
- Shows: total listings, volume, average price, floor price, fees
- Recent activity feed

#### Hooks

##### useMarketplace
Provides marketplace operations:
- `createListing(tokenId, price, expiryBlocks)`
- `purchaseListing(listingId)`
- `updateListingPrice(listingId, newPrice)`
- `cancelListing(listingId)`

#### Context

##### MarketplaceContext
Global state management for:
- Active listings
- User's listings
- Purchase history
- Fee information
- Loading and error states

#### Pages

##### /marketplace
Main marketplace page with tabs:
- Browse Listings
- Create Listing
- Statistics

## API Reference

### Contract Functions

#### Public Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create-listing` | token-id, price, expiry-blocks | (ok listing-id) \| (err code) | Create new listing |
| `purchase-listing` | listing-id | (ok bool) \| (err code) | Purchase listing |
| `update-listing-price` | listing-id, new-price | (ok bool) \| (err code) | Update price |
| `cancel-listing` | listing-id | (ok bool) \| (err code) | Cancel listing |
| `set-marketplace-fee` | fee-percent | (ok bool) \| (err code) | Set fee % |
| `set-fee-recipient` | recipient | (ok bool) \| (err code) | Set fee recipient |

#### Read-Only Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `get-listing` | listing-id | (ok listing-data) \| (err code) | Get listing details |
| `get-seller-listings` | seller | (ok listing-ids) | Get seller's listings |
| `get-purchase-history` | buyer, listing-id | (ok purchase-data) \| (err code) | Get purchase record |
| `is-listing-active` | listing-id | (ok bool) | Check if active |
| `get-marketplace-fee-info` | - | (ok fee-info) | Get fee configuration |

### Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 102 | ERR-NOT-OWNER | Caller is not owner/seller |
| 103 | ERR-SELF-TRANSFER | Cannot buy own listing |
| 106 | ERR-UNAUTHORIZED | Caller is not admin |
| 107 | ERR-PAUSED | Marketplace is paused |
| 108 | ERR-LISTING-NOT-FOUND | Listing doesn't exist |
| 109 | ERR-INVALID-PRICE | Invalid price |

## Usage Examples

### Creating a Listing

```typescript
import { useMarketplace } from '@/hooks/useMarketplace';

function CreateListingExample() {
  const { createListing, loading, error } = useMarketplace();

  const handleCreate = async () => {
    try {
      const result = await createListing(
        1,           // token-id
        1000000,     // price in microSTX
        1000         // expiry in blocks
      );
      console.log('Listing created:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <button onClick={handleCreate} disabled={loading}>
      {loading ? 'Creating...' : 'Create Listing'}
    </button>
  );
}
```

### Purchasing a Listing

```typescript
import { PurchaseModal } from '@/components/PurchaseModal';

function PurchaseExample() {
  const [isOpen, setIsOpen] = useState(false);
  const { purchaseListing } = useMarketplace();

  const handlePurchase = async () => {
    await purchaseListing(1); // listing-id
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Buy Now</button>
      <PurchaseModal
        isOpen={isOpen}
        listing={listingData}
        feePercent={2}
        onConfirm={handlePurchase}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Accessing Marketplace Context

```typescript
import { useMarketplaceContext } from '@/context/MarketplaceContext';

function MyListingsExample() {
  const { userListings, loading } = useMarketplaceContext();

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {userListings.map((listing) => (
            <li key={listing.listingId}>
              Token #{listing.tokenId} - {listing.price} STX
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Fee Structure

- **Default Fee**: 2%
- **Maximum Fee**: 10%
- **Fee Recipient**: Configurable by admin
- **Fee Calculation**: `fee = (price * fee_percent) / 100`

Example:
- Listing Price: 100 STX
- Fee Percent: 2%
- Fee Amount: 2 STX
- Seller Receives: 98 STX

## Security Considerations

1. **Ownership Verification**: Only token owners can create listings
2. **Seller Verification**: Only sellers can update/cancel their listings
3. **Admin Controls**: Fee management restricted to contract admin
4. **Pause Mechanism**: Marketplace can be paused by admin
5. **Fee Limits**: Maximum fee capped at 10%
6. **Transaction Validation**: All operations validated before execution

## Testing

### Running Tests

```bash
# Run all marketplace tests
npm test -- marketplace.test.ts

# Run specific test suite
npm test -- marketplace.test.ts -t "Listing Creation"
```

### Test Coverage

- ✅ Listing creation with validation
- ✅ Purchase functionality and token transfer
- ✅ Fee calculation and distribution
- ✅ Listing updates and cancellation
- ✅ Seller tracking and history
- ✅ Error handling and edge cases
- ✅ Admin functions and permissions

## Deployment

### Prerequisites

- Stacks wallet with STX for deployment
- Clarinet installed and configured
- Environment variables set

### Deployment Steps

```bash
# 1. Deploy contract to testnet
./deploy-testnet.sh

# 2. Configure marketplace settings
# - Set initial fee percentage
# - Set fee recipient address

# 3. Deploy frontend
npm run build
npm run start

# 4. Verify deployment
# - Test listing creation
# - Test purchase flow
# - Verify fee collection
```

## Troubleshooting

### Listing Creation Fails

**Problem**: "ERR-NOT-OWNER"
- **Solution**: Ensure you own the token you're trying to list

**Problem**: "ERR-INVALID-PRICE"
- **Solution**: Price must be greater than 0

### Purchase Fails

**Problem**: "ERR-SELF-TRANSFER"
- **Solution**: Cannot purchase your own listing

**Problem**: "ERR-LISTING-NOT-FOUND"
- **Solution**: Listing doesn't exist or has been cancelled

### Fee Configuration Issues

**Problem**: Cannot set fee
- **Solution**: Only admin can set fees

**Problem**: Fee exceeds 10%
- **Solution**: Maximum fee is 10%

## Future Enhancements

- [ ] Auction functionality
- [ ] Bulk listing operations
- [ ] Advanced filtering and search
- [ ] Listing expiry automation
- [ ] Royalty support
- [ ] Multi-currency support
- [ ] Escrow functionality
- [ ] Dispute resolution

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test cases for usage examples
3. Check contract events for transaction details
4. Contact support team

## License

This marketplace implementation is part of the Bitdap Pass project and follows the same license terms.
