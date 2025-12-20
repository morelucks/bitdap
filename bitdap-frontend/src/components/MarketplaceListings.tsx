'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useContractRead } from '@/hooks/useContractRead';
import styles from './MarketplaceListings.module.css';

interface Listing {
  listingId: number;
  tokenId: number;
  seller: string;
  price: number;
  createdAt: number;
  active: boolean;
}

export function MarketplaceListings() {
  const { address, isConnected } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'my-listings'>('all');

  const { data: listingCount, execute: fetchListingCount } = useContractRead({
    contractAddress: process.env.NEXT_PUBLIC_BITDAP_CONTRACT || '',
    contractName: 'bitdap',
    functionName: 'get-listing-count',
    functionArgs: [],
  });

  useEffect(() => {
    if (isConnected) {
      fetchListingCount();
    }
  }, [isConnected, fetchListingCount]);

  const handleFilterChange = (newFilter: 'all' | 'active' | 'my-listings') => {
    setFilter(newFilter);
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === 'active') return listing.active;
    if (filter === 'my-listings') return listing.seller === address;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Marketplace Listings</h2>
        <div className={styles.stats}>
          <span>Total Listings: {listingCount || 0}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All Listings
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
          onClick={() => handleFilterChange('active')}
        >
          Active
        </button>
        {isConnected && (
          <button
            className={`${styles.filterBtn} ${filter === 'my-listings' ? styles.active : ''}`}
            onClick={() => handleFilterChange('my-listings')}
          >
            My Listings
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className={styles.empty}>No listings found</div>
      ) : (
        <div className={styles.grid}>
          {filteredListings.map((listing) => (
            <ListingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const { address } = useWallet();
  const isOwner = address === listing.seller;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.tokenId}>Token #{listing.tokenId}</span>
        {listing.active ? (
          <span className={styles.badge}>Active</span>
        ) : (
          <span className={`${styles.badge} ${styles.inactive}`}>Sold</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.priceSection}>
          <span className={styles.label}>Price</span>
          <span className={styles.price}>{(listing.price / 1000000).toFixed(2)} STX</span>
        </div>

        <div className={styles.sellerSection}>
          <span className={styles.label}>Seller</span>
          <span className={styles.seller}>
            {isOwner ? 'You' : `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}
          </span>
        </div>

        <div className={styles.createdSection}>
          <span className={styles.label}>Listed</span>
          <span className={styles.created}>Block #{listing.createdAt}</span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        {listing.active && !isOwner && (
          <button className={styles.buyBtn}>Buy Now</button>
        )}
        {isOwner && listing.active && (
          <button className={styles.editBtn}>Edit Price</button>
        )}
        {isOwner && listing.active && (
          <button className={styles.cancelBtn}>Cancel</button>
        )}
      </div>
    </div>
  );
}
