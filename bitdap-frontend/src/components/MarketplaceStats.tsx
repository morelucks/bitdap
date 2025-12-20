'use client';

import { useState, useEffect } from 'react';
import { useContractRead } from '@/hooks/useContractRead';
import styles from './MarketplaceStats.module.css';

type TimeRange = '24h' | '7d' | '30d' | 'all';

export function MarketplaceStats() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [stats, setStats] = useState({
    totalListings: 0,
    totalVolume: 0,
    averagePrice: 0,
    totalFees: 0,
    floorPrice: 0,
  });

  const { data: listingCount, execute: fetchListingCount } = useContractRead({
    contractAddress: process.env.NEXT_PUBLIC_BITDAP_CONTRACT || '',
    contractName: 'bitdap',
    functionName: 'get-listing-count',
    functionArgs: [],
  });

  const { data: feeInfo, execute: fetchFeeInfo } = useContractRead({
    contractAddress: process.env.NEXT_PUBLIC_BITDAP_CONTRACT || '',
    contractName: 'bitdap',
    functionName: 'get-marketplace-fee-info',
    functionArgs: [],
  });

  useEffect(() => {
    fetchListingCount();
    fetchFeeInfo();
  }, [fetchListingCount, fetchFeeInfo]);

  useEffect(() => {
    // Update stats based on fetched data
    if (listingCount) {
      setStats((prev) => ({
        ...prev,
        totalListings: Number(listingCount) || 0,
      }));
    }
  }, [listingCount, feeInfo]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // TODO: Fetch stats for the selected time range
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Marketplace Statistics</h2>
        <div className={styles.timeRangeSelector}>
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range === '24h' ? '24H' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Listings"
          value={stats.totalListings.toString()}
          icon="📋"
          trend={null}
        />
        <StatCard
          title="Total Volume"
          value={`${(stats.totalVolume / 1000000).toFixed(2)} STX`}
          icon="📊"
          trend={null}
        />
        <StatCard
          title="Average Price"
          value={`${(stats.averagePrice / 1000000).toFixed(2)} STX`}
          icon="💰"
          trend={null}
        />
        <StatCard
          title="Floor Price"
          value={`${(stats.floorPrice / 1000000).toFixed(2)} STX`}
          icon="📈"
          trend={null}
        />
        <StatCard
          title="Total Fees Collected"
          value={`${(stats.totalFees / 1000000).toFixed(2)} STX`}
          icon="💵"
          trend={null}
        />
        <StatCard
          title="Marketplace Fee"
          value={feeInfo ? `${(feeInfo as any).value.fee_percent.value}%` : '2%'}
          icon="⚙️"
          trend={null}
        />
      </div>

      <div className={styles.chartSection}>
        <h3>Volume Over Time</h3>
        <div className={styles.chartPlaceholder}>
          <p>Chart visualization coming soon</p>
        </div>
      </div>

      <div className={styles.activitySection}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <span className={styles.activityType}>Listing Created</span>
            <span className={styles.activityTime}>2 minutes ago</span>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityType}>Purchase Completed</span>
            <span className={styles.activityTime}>15 minutes ago</span>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityType}>Price Updated</span>
            <span className={styles.activityTime}>1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend: number | null;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.value}>{value}</span>
        {trend !== null && (
          <span className={`${styles.trend} ${trend >= 0 ? styles.positive : styles.negative}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
