'use client';

import { useState } from 'react';
import { MarketplaceListings } from '@/components/MarketplaceListings';
import { CreateListing } from '@/components/CreateListing';
import { MarketplaceStats } from '@/components/MarketplaceStats';
import styles from './marketplace.module.css';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'stats'>('browse');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bitdap Pass Marketplace</h1>
        <p>Buy, sell, and trade Bitdap Pass NFTs</p>
      </div>

      <nav className={styles.nav}>
        <button
          className={`${styles.navBtn} ${activeTab === 'browse' ? styles.active : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Listings
        </button>
        <button
          className={`${styles.navBtn} ${activeTab === 'create' ? styles.active : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Listing
        </button>
        <button
          className={`${styles.navBtn} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </nav>

      <div className={styles.content}>
        {activeTab === 'browse' && <MarketplaceListings />}
        {activeTab === 'create' && <CreateListing />}
        {activeTab === 'stats' && <MarketplaceStats />}
      </div>
    </div>
  );
}
