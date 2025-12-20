'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Listing {
  listingId: number;
  tokenId: number;
  seller: string;
  price: number;
  createdAt: number;
  active: boolean;
}

export interface PurchaseRecord {
  listingId: number;
  tokenId: number;
  purchasePrice: number;
  purchasedAt: number;
  seller: string;
}

export interface MarketplaceContextType {
  listings: Listing[];
  userListings: Listing[];
  purchaseHistory: PurchaseRecord[];
  feeInfo: {
    feePercent: number;
    feeRecipient: string;
    totalFeesCollected: number;
  };
  loading: boolean;
  error: string | null;
  addListing: (listing: Listing) => void;
  removeListing: (listingId: number) => void;
  updateListing: (listing: Listing) => void;
  addPurchase: (purchase: PurchaseRecord) => void;
  setFeeInfo: (info: MarketplaceContextType['feeInfo']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [feeInfo, setFeeInfoState] = useState({
    feePercent: 2,
    feeRecipient: '',
    totalFeesCollected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addListing = useCallback((listing: Listing) => {
    setListings((prev) => [...prev, listing]);
  }, []);

  const removeListing = useCallback((listingId: number) => {
    setListings((prev) => prev.filter((l) => l.listingId !== listingId));
    setUserListings((prev) => prev.filter((l) => l.listingId !== listingId));
  }, []);

  const updateListing = useCallback((listing: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.listingId === listing.listingId ? listing : l))
    );
    setUserListings((prev) =>
      prev.map((l) => (l.listingId === listing.listingId ? listing : l))
    );
  }, []);

  const addPurchase = useCallback((purchase: PurchaseRecord) => {
    setPurchaseHistory((prev) => [purchase, ...prev]);
  }, []);

  const setFeeInfo = useCallback((info: MarketplaceContextType['feeInfo']) => {
    setFeeInfoState(info);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: MarketplaceContextType = {
    listings,
    userListings,
    purchaseHistory,
    feeInfo,
    loading,
    error,
    addListing,
    removeListing,
    updateListing,
    addPurchase,
    setFeeInfo,
    setLoading,
    setError,
    clearError,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplaceContext() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplaceContext must be used within MarketplaceProvider');
  }
  return context;
}
