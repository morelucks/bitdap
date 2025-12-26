/**
 * NFT Marketplace Interface
 * Handles marketplace operations and integrations
 */

import { NFTContractInterface } from '../nft-contract-interface.js';
import { Logger } from '../../logging/logger.js';
import { MarketplaceInfo } from '../types.js';
import chalk from 'chalk';

export interface MarketplaceListing {
  tokenId: number;
  seller: string;
  price: number;
  currency: 'STX' | 'USD';
  listingId: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
}

export interface MarketplaceSale {
  tokenId: number;
  seller: string;
  buyer: string;
  price: number;
  currency: 'STX' | 'USD';
  saleDate: string;
  transactionId: string;
  royaltyPaid: number;
  marketplaceFee: number;
}

export interface MarketplaceOffer {
  tokenId: number;
  offerer: string;
  amount: number;
  currency: 'STX' | 'USD';
  expiresAt: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
}

export class MarketplaceInterface {
  private contractInterface: NFTContractInterface;
  private logger: Logger;

  constructor() {
    this.contractInterface = new NFTContractInterface();
    this.logger = Logger.getInstance();
  }

  /**
   * Get marketplace information
   */
  public async getMarketplaceInfo(): Promise<MarketplaceInfo> {
    console.log(chalk.blue('🏪 Fetching marketplace information...'));

    // Simulate marketplace data (in real implementation, this would query marketplace APIs)
    const marketplaceInfo: MarketplaceInfo = {
      floorPrice: 50000, // 0.05 STX in microSTX
      totalVolume: 5000000, // 5 STX in microSTX
      averagePrice: 75000, // 0.075 STX in microSTX
      activeListings: 25
    };

    this.logger.info('Marketplace info retrieved', marketplaceInfo);

    return marketplaceInfo;
  }

  /**
   * Get active listings for the collection
   */
  public async getActiveListings(limit: number = 20): Promise<MarketplaceListing[]> {
    console.log(chalk.blue('📋 Fetching active listings...'));

    // Simulate active listings data
    const listings: MarketplaceListing[] = [];
    
    for (let i = 1; i <= Math.min(limit, 25); i++) {
      listings.push({
        tokenId: i,
        seller: `ST1SELLER${i}...`,
        price: Math.floor(Math.random() * 100000) + 50000, // 0.05-0.15 STX
        currency: 'STX',
        listingId: `listing-${i}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });
    }

    this.logger.info('Active listings retrieved', { count: listings.length });

    return listings;
  }

  /**
   * Get recent sales for the collection
   */
  public async getRecentSales(limit: number = 20): Promise<MarketplaceSale[]> {
    console.log(chalk.blue('💰 Fetching recent sales...'));

    // Simulate recent sales data
    const sales: MarketplaceSale[] = [];
    
    for (let i = 1; i <= Math.min(limit, 15); i++) {
      const price = Math.floor(Math.random() * 150000) + 25000; // 0.025-0.175 STX
      const royaltyRate = 0.05; // 5% royalty
      const marketplaceFeeRate = 0.025; // 2.5% marketplace fee
      
      sales.push({
        tokenId: Math.floor(Math.random() * 100) + 1,
        seller: `ST1SELLER${i}...`,
        buyer: `ST1BUYER${i}...`,
        price,
        currency: 'STX',
        saleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: `0x${Math.random().toString(16).substr(2, 8)}...`,
        royaltyPaid: Math.floor(price * royaltyRate),
        marketplaceFee: Math.floor(price * marketplaceFeeRate)
      });
    }

    // Sort by sale date (most recent first)
    sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    this.logger.info('Recent sales retrieved', { count: sales.length });

    return sales;
  }

  /**
   * Get price history for a specific token
   */
  public async getTokenPriceHistory(tokenId: number): Promise<MarketplaceSale[]> {
    console.log(chalk.blue(`📈 Fetching price history for token ${tokenId}...`));

    // Simulate price history for the token
    const history: MarketplaceSale[] = [];
    const saleCount = Math.floor(Math.random() * 5) + 1; // 1-5 sales
    
    for (let i = 0; i < saleCount; i++) {
      const price = Math.floor(Math.random() * 100000) + 30000; // 0.03-0.13 STX
      
      history.push({
        tokenId,
        seller: `ST1SELLER${i + 1}...`,
        buyer: `ST1BUYER${i + 1}...`,
        price,
        currency: 'STX',
        saleDate: new Date(Date.now() - (saleCount - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        transactionId: `0x${Math.random().toString(16).substr(2, 8)}...`,
        royaltyPaid: Math.floor(price * 0.05),
        marketplaceFee: Math.floor(price * 0.025)
      });
    }

    this.logger.info('Token price history retrieved', { tokenId, salesCount: history.length });

    return history;
  }

  /**
   * Get marketplace analytics
   */
  public async getMarketplaceAnalytics(): Promise<{
    totalVolume: number;
    totalSales: number;
    averagePrice: number;
    floorPrice: number;
    ceilingPrice: number;
    uniqueBuyers: number;
    uniqueSellers: number;
    dailyVolume: Array<{
      date: string;
      volume: number;
      sales: number;
    }>;
    priceDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }> {
    console.log(chalk.blue('📊 Generating marketplace analytics...'));

    const recentSales = await this.getRecentSales(100);
    
    const totalVolume = recentSales.reduce((sum, sale) => sum + sale.price, 0);
    const totalSales = recentSales.length;
    const averagePrice = totalSales > 0 ? totalVolume / totalSales : 0;
    const prices = recentSales.map(sale => sale.price).sort((a, b) => a - b);
    const floorPrice = prices[0] || 0;
    const ceilingPrice = prices[prices.length - 1] || 0;
    
    const uniqueBuyers = new Set(recentSales.map(sale => sale.buyer)).size;
    const uniqueSellers = new Set(recentSales.map(sale => sale.seller)).size;

    // Generate daily volume data for last 30 days
    const dailyVolume: Array<{ date: string; volume: number; sales: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const daySales = recentSales.filter(sale => sale.saleDate.startsWith(date));
      const dayVolume = daySales.reduce((sum, sale) => sum + sale.price, 0);
      
      dailyVolume.push({
        date,
        volume: dayVolume,
        sales: daySales.length
      });
    }

    // Generate price distribution
    const priceRanges = [
      { min: 0, max: 25000, label: '0-0.025 STX' },
      { min: 25000, max: 50000, label: '0.025-0.05 STX' },
      { min: 50000, max: 100000, label: '0.05-0.1 STX' },
      { min: 100000, max: 200000, label: '0.1-0.2 STX' },
      { min: 200000, max: Infinity, label: '0.2+ STX' }
    ];

    const priceDistribution = priceRanges.map(range => {
      const count = prices.filter(price => price >= range.min && price < range.max).length;
      const percentage = totalSales > 0 ? (count / totalSales) * 100 : 0;
      
      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    const analytics = {
      totalVolume,
      totalSales,
      averagePrice: Math.round(averagePrice),
      floorPrice,
      ceilingPrice,
      uniqueBuyers,
      uniqueSellers,
      dailyVolume,
      priceDistribution
    };

    this.logger.info('Marketplace analytics generated', {
      totalVolume,
      totalSales,
      averagePrice: analytics.averagePrice,
      uniqueBuyers,
      uniqueSellers
    });

    return analytics;
  }

  /**
   * Get trending tokens
   */
  public async getTrendingTokens(limit: number = 10): Promise<Array<{
    tokenId: number;
    currentPrice: number;
    priceChange24h: number;
    priceChangePercentage: number;
    volume24h: number;
    sales24h: number;
  }>> {
    console.log(chalk.blue('🔥 Fetching trending tokens...'));

    const trending: Array<{
      tokenId: number;
      currentPrice: number;
      priceChange24h: number;
      priceChangePercentage: number;
      volume24h: number;
      sales24h: number;
    }> = [];

    for (let i = 1; i <= Math.min(limit, 10); i++) {
      const currentPrice = Math.floor(Math.random() * 100000) + 50000;
      const priceChange24h = Math.floor(Math.random() * 20000) - 10000; // -0.01 to +0.01 STX
      const priceChangePercentage = ((priceChange24h / (currentPrice - priceChange24h)) * 100);
      
      trending.push({
        tokenId: Math.floor(Math.random() * 1000) + 1,
        currentPrice,
        priceChange24h,
        priceChangePercentage: Math.round(priceChangePercentage * 100) / 100,
        volume24h: Math.floor(Math.random() * 500000) + 100000,
        sales24h: Math.floor(Math.random() * 5) + 1
      });
    }

    // Sort by price change percentage (highest first)
    trending.sort((a, b) => b.priceChangePercentage - a.priceChangePercentage);

    this.logger.info('Trending tokens retrieved', { count: trending.length });

    return trending;
  }

  /**
   * Estimate listing price for a token
   */
  public async estimateListingPrice(tokenId: number): Promise<{
    suggestedPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    reasoning: string[];
    confidence: 'high' | 'medium' | 'low';
  }> {
    console.log(chalk.blue(`💡 Estimating listing price for token ${tokenId}...`));

    const marketplaceInfo = await this.getMarketplaceInfo();
    const tokenHistory = await this.getTokenPriceHistory(tokenId);
    const recentSales = await this.getRecentSales(50);

    let suggestedPrice = marketplaceInfo.floorPrice;
    const reasoning: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // Factor in token's price history
    if (tokenHistory.length > 0) {
      const lastSalePrice = tokenHistory[tokenHistory.length - 1].price;
      suggestedPrice = Math.max(suggestedPrice, lastSalePrice * 0.95); // 5% below last sale
      reasoning.push(`Based on last sale price of ${lastSalePrice} microSTX`);
      confidence = 'high';
    } else {
      reasoning.push('No previous sales history for this token');
      confidence = 'low';
    }

    // Factor in collection floor price
    if (marketplaceInfo.floorPrice > 0) {
      suggestedPrice = Math.max(suggestedPrice, marketplaceInfo.floorPrice * 1.05); // 5% above floor
      reasoning.push(`Collection floor price is ${marketplaceInfo.floorPrice} microSTX`);
    }

    // Factor in recent sales average
    if (recentSales.length > 0) {
      const recentAverage = recentSales.reduce((sum, sale) => sum + sale.price, 0) / recentSales.length;
      suggestedPrice = (suggestedPrice + recentAverage) / 2; // Average with recent sales
      reasoning.push(`Recent sales average: ${Math.round(recentAverage)} microSTX`);
    }

    const priceRange = {
      min: Math.round(suggestedPrice * 0.85), // 15% below suggested
      max: Math.round(suggestedPrice * 1.25)  // 25% above suggested
    };

    suggestedPrice = Math.round(suggestedPrice);

    this.logger.info('Listing price estimated', {
      tokenId,
      suggestedPrice,
      confidence,
      reasoningCount: reasoning.length
    });

    return {
      suggestedPrice,
      priceRange,
      reasoning,
      confidence
    };
  }

  /**
   * Get marketplace fees information
   */
  public getMarketplaceFees(): {
    royaltyFee: number;
    marketplaceFee: number;
    totalFees: number;
    feeBreakdown: Array<{
      type: string;
      percentage: number;
      description: string;
    }>;
  } {
    const royaltyFee = 5.0; // 5%
    const marketplaceFee = 2.5; // 2.5%
    const totalFees = royaltyFee + marketplaceFee;

    return {
      royaltyFee,
      marketplaceFee,
      totalFees,
      feeBreakdown: [
        {
          type: 'Royalty',
          percentage: royaltyFee,
          description: 'Paid to the original creator'
        },
        {
          type: 'Marketplace',
          percentage: marketplaceFee,
          description: 'Platform fee for listing and transaction services'
        }
      ]
    };
  }

  /**
   * Calculate net proceeds from a sale
   */
  public calculateNetProceeds(salePrice: number): {
    grossPrice: number;
    royaltyFee: number;
    marketplaceFee: number;
    totalFees: number;
    netProceeds: number;
    feePercentage: number;
  } {
    const fees = this.getMarketplaceFees();
    const royaltyFee = Math.floor(salePrice * (fees.royaltyFee / 100));
    const marketplaceFee = Math.floor(salePrice * (fees.marketplaceFee / 100));
    const totalFees = royaltyFee + marketplaceFee;
    const netProceeds = salePrice - totalFees;
    const feePercentage = (totalFees / salePrice) * 100;

    return {
      grossPrice: salePrice,
      royaltyFee,
      marketplaceFee,
      totalFees,
      netProceeds,
      feePercentage: Math.round(feePercentage * 100) / 100
    };
  }

  /**
   * Get collection ranking
   */
  public async getCollectionRanking(): Promise<{
    rank: number;
    totalCollections: number;
    rankingFactors: Array<{
      factor: string;
      score: number;
      weight: number;
    }>;
    overallScore: number;
  }> {
    console.log(chalk.blue('🏆 Fetching collection ranking...'));

    // Simulate ranking data
    const rankingFactors = [
      { factor: 'Volume', score: 85, weight: 30 },
      { factor: 'Floor Price', score: 70, weight: 20 },
      { factor: 'Holder Count', score: 90, weight: 25 },
      { factor: 'Activity', score: 75, weight: 15 },
      { factor: 'Social Engagement', score: 80, weight: 10 }
    ];

    const overallScore = rankingFactors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight / 100), 0
    );

    const ranking = {
      rank: 42, // Simulated rank
      totalCollections: 1500,
      rankingFactors,
      overallScore: Math.round(overallScore)
    };

    this.logger.info('Collection ranking retrieved', ranking);

    return ranking;
  }
}