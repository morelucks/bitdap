/**
 * NFT Marketplace Command
 * Handles marketplace operations and data retrieval
 */

import { CommandDefinition } from '../../config/types.js';
import { MarketplaceInterface } from '../marketplace/marketplace-interface.js';
import { Logger } from '../../logging/logger.js';
import chalk from 'chalk';

export class MarketplaceNFTCommand {
  private marketplaceInterface: MarketplaceInterface;
  private logger: Logger;

  constructor() {
    this.marketplaceInterface = new MarketplaceInterface();
    this.logger = Logger.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'nft-marketplace',
      description: 'Access marketplace data and operations',
      aliases: ['marketplace-nft', 'nmarket'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Marketplace action: info, listings, sales, history, analytics, trending, estimate, fees, ranking'
        },
        {
          name: 'token-id',
          type: 'number',
          required: false,
          description: 'Token ID (required for token-specific actions)',
          validation: [
            {
              type: 'min',
              value: 1,
              message: 'Token ID must be greater than 0'
            }
          ]
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Maximum number of results to return (default: 20)'
        },
        {
          name: 'price',
          type: 'number',
          required: false,
          description: 'Price for calculations (in microSTX)'
        },
        {
          name: 'output',
          type: 'string',
          required: false,
          description: 'Output file path for data export'
        },
        {
          name: 'format',
          type: 'string',
          required: false,
          description: 'Output format: json, csv (default: json)'
        }
      ],
      examples: [
        'npm run token-interact nft-marketplace --action info',
        'npm run token-interact nft-marketplace --action listings --limit 10',
        'npm run token-interact marketplace-nft --action sales --output recent-sales.json',
        'npm run token-interact nmarket --action history --token-id 1',
        'npm run token-interact nft-marketplace --action estimate --token-id 5',
        'npm run token-interact nft-marketplace --action fees --price 100000'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the marketplace command
   */
  public async execute(args: any): Promise<any> {
    const { 
      action,
      'token-id': tokenId,
      limit = 20,
      price,
      output,
      format = 'json'
    } = args;

    try {
      console.log(chalk.blue('🏪 Marketplace action:'), action);

      let result: any;

      switch (action.toLowerCase()) {
        case 'info':
        case 'information':
          result = await this.getMarketplaceInfo();
          break;

        case 'listings':
        case 'active-listings':
          result = await this.getActiveListings(limit, output, format);
          break;

        case 'sales':
        case 'recent-sales':
          result = await this.getRecentSales(limit, output, format);
          break;

        case 'history':
        case 'price-history':
          if (!tokenId) {
            throw new Error('Token ID is required for price history');
          }
          result = await this.getTokenPriceHistory(tokenId, output, format);
          break;

        case 'analytics':
        case 'stats':
          result = await this.getMarketplaceAnalytics(output, format);
          break;

        case 'trending':
        case 'hot':
          result = await this.getTrendingTokens(limit, output, format);
          break;

        case 'estimate':
        case 'price-estimate':
          if (!tokenId) {
            throw new Error('Token ID is required for price estimation');
          }
          result = await this.estimateListingPrice(tokenId);
          break;

        case 'fees':
        case 'fee-calculator':
          result = await this.calculateFees(price);
          break;

        case 'ranking':
        case 'rank':
          result = await this.getCollectionRanking();
          break;

        default:
          throw new Error(`Unknown marketplace action: ${action}. Available actions: info, listings, sales, history, analytics, trending, estimate, fees, ranking`);
      }

      return {
        success: true,
        data: result,
        message: `Marketplace ${action} completed successfully`
      };

    } catch (error: any) {
      this.logger.error('NFT marketplace command failed', {
        action,
        tokenId,
        error: error.message
      });
      
      console.log(chalk.red('❌ Marketplace action failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'MARKETPLACE_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Marketplace operation failed'
      };
    }
  }

  /**
   * Get marketplace information
   */
  private async getMarketplaceInfo(): Promise<any> {
    const info = await this.marketplaceInterface.getMarketplaceInfo();
    
    console.log(chalk.green('🏪 Marketplace Information:'));
    console.log(`  Floor Price: ${info.floorPrice} microSTX (${(info.floorPrice / 1000000).toFixed(6)} STX)`);
    console.log(`  Total Volume: ${info.totalVolume} microSTX (${(info.totalVolume / 1000000).toFixed(6)} STX)`);
    console.log(`  Average Price: ${info.averagePrice} microSTX (${(info.averagePrice / 1000000).toFixed(6)} STX)`);
    console.log(`  Active Listings: ${info.activeListings}`);
    
    this.logger.info('Marketplace info retrieved', info);
    
    return info;
  }

  /**
   * Get active listings
   */
  private async getActiveListings(limit: number, outputFile?: string, format?: string): Promise<any> {
    const listings = await this.marketplaceInterface.getActiveListings(limit);
    
    if (outputFile) {
      this.saveData(listings, outputFile, format);
    } else {
      console.log(chalk.green(`📋 Active Listings (${listings.length}):`));
      listings.slice(0, 10).forEach(listing => {
        console.log(`  Token ${listing.tokenId}: ${listing.price} microSTX by ${listing.seller}`);
        console.log(`    Listed: ${new Date(listing.createdAt).toLocaleDateString()}`);
        console.log(`    Expires: ${listing.expiresAt ? new Date(listing.expiresAt).toLocaleDateString() : 'Never'}`);
      });
      
      if (listings.length > 10) {
        console.log(chalk.gray(`  ... and ${listings.length - 10} more listings`));
      }
    }
    
    this.logger.info('Active listings retrieved', { count: listings.length, outputFile });
    
    return {
      listings,
      count: listings.length,
      outputFile
    };
  }

  /**
   * Get recent sales
   */
  private async getRecentSales(limit: number, outputFile?: string, format?: string): Promise<any> {
    const sales = await this.marketplaceInterface.getRecentSales(limit);
    
    if (outputFile) {
      this.saveData(sales, outputFile, format);
    } else {
      console.log(chalk.green(`💰 Recent Sales (${sales.length}):`));
      sales.slice(0, 10).forEach(sale => {
        console.log(`  Token ${sale.tokenId}: ${sale.price} microSTX`);
        console.log(`    ${sale.seller} → ${sale.buyer}`);
        console.log(`    Date: ${new Date(sale.saleDate).toLocaleDateString()}`);
        console.log(`    Royalty: ${sale.royaltyPaid} microSTX, Fee: ${sale.marketplaceFee} microSTX`);
      });
      
      if (sales.length > 10) {
        console.log(chalk.gray(`  ... and ${sales.length - 10} more sales`));
      }
    }
    
    this.logger.info('Recent sales retrieved', { count: sales.length, outputFile });
    
    return {
      sales,
      count: sales.length,
      outputFile
    };
  }

  /**
   * Get token price history
   */
  private async getTokenPriceHistory(tokenId: number, outputFile?: string, format?: string): Promise<any> {
    const history = await this.marketplaceInterface.getTokenPriceHistory(tokenId);
    
    if (outputFile) {
      this.saveData(history, outputFile, format);
    } else {
      console.log(chalk.green(`📈 Price History for Token ${tokenId}:`));
      
      if (history.length === 0) {
        console.log(chalk.yellow('  No sales history found for this token'));
      } else {
        history.forEach((sale, index) => {
          console.log(`  Sale ${index + 1}: ${sale.price} microSTX`);
          console.log(`    ${sale.seller} → ${sale.buyer}`);
          console.log(`    Date: ${new Date(sale.saleDate).toLocaleDateString()}`);
        });
        
        // Calculate price trend
        if (history.length > 1) {
          const firstPrice = history[0].price;
          const lastPrice = history[history.length - 1].price;
          const priceChange = lastPrice - firstPrice;
          const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
          
          const trendColor = priceChange > 0 ? chalk.green : priceChange < 0 ? chalk.red : chalk.gray;
          console.log(trendColor(`  Price Trend: ${priceChangePercent}% (${priceChange > 0 ? '+' : ''}${priceChange} microSTX)`));
        }
      }
    }
    
    this.logger.info('Token price history retrieved', { tokenId, salesCount: history.length, outputFile });
    
    return {
      tokenId,
      history,
      salesCount: history.length,
      outputFile
    };
  }

  /**
   * Get marketplace analytics
   */
  private async getMarketplaceAnalytics(outputFile?: string, format?: string): Promise<any> {
    const analytics = await this.marketplaceInterface.getMarketplaceAnalytics();
    
    if (outputFile) {
      this.saveData(analytics, outputFile, format);
    } else {
      console.log(chalk.green('📊 Marketplace Analytics:'));
      
      console.log(chalk.blue('\nOverview:'));
      console.log(`  Total Volume: ${analytics.totalVolume} microSTX (${(analytics.totalVolume / 1000000).toFixed(6)} STX)`);
      console.log(`  Total Sales: ${analytics.totalSales}`);
      console.log(`  Average Price: ${analytics.averagePrice} microSTX (${(analytics.averagePrice / 1000000).toFixed(6)} STX)`);
      console.log(`  Floor Price: ${analytics.floorPrice} microSTX`);
      console.log(`  Ceiling Price: ${analytics.ceilingPrice} microSTX`);
      console.log(`  Unique Buyers: ${analytics.uniqueBuyers}`);
      console.log(`  Unique Sellers: ${analytics.uniqueSellers}`);
      
      console.log(chalk.blue('\nPrice Distribution:'));
      analytics.priceDistribution.forEach(dist => {
        console.log(`  ${dist.range}: ${dist.count} sales (${dist.percentage}%)`);
      });
      
      console.log(chalk.blue('\nRecent Daily Volume:'));
      analytics.dailyVolume.slice(-7).forEach(day => {
        console.log(`  ${day.date}: ${day.volume} microSTX (${day.sales} sales)`);
      });
    }
    
    this.logger.info('Marketplace analytics retrieved', {
      totalVolume: analytics.totalVolume,
      totalSales: analytics.totalSales,
      outputFile
    });
    
    return {
      analytics,
      outputFile
    };
  }

  /**
   * Get trending tokens
   */
  private async getTrendingTokens(limit: number, outputFile?: string, format?: string): Promise<any> {
    const trending = await this.marketplaceInterface.getTrendingTokens(limit);
    
    if (outputFile) {
      this.saveData(trending, outputFile, format);
    } else {
      console.log(chalk.green(`🔥 Trending Tokens (${trending.length}):`));
      trending.forEach((token, index) => {
        const changeColor = token.priceChangePercentage > 0 ? chalk.green : 
                           token.priceChangePercentage < 0 ? chalk.red : chalk.gray;
        
        console.log(`  ${index + 1}. Token ${token.tokenId}: ${token.currentPrice} microSTX`);
        console.log(changeColor(`    24h Change: ${token.priceChangePercentage > 0 ? '+' : ''}${token.priceChangePercentage}% (${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h} microSTX)`));
        console.log(`    24h Volume: ${token.volume24h} microSTX (${token.sales24h} sales)`);
      });
    }
    
    this.logger.info('Trending tokens retrieved', { count: trending.length, outputFile });
    
    return {
      trending,
      count: trending.length,
      outputFile
    };
  }

  /**
   * Estimate listing price for token
   */
  private async estimateListingPrice(tokenId: number): Promise<any> {
    const estimate = await this.marketplaceInterface.estimateListingPrice(tokenId);
    
    console.log(chalk.green(`💡 Price Estimate for Token ${tokenId}:`));
    console.log(`  Suggested Price: ${estimate.suggestedPrice} microSTX (${(estimate.suggestedPrice / 1000000).toFixed(6)} STX)`);
    console.log(`  Price Range: ${estimate.priceRange.min} - ${estimate.priceRange.max} microSTX`);
    
    const confidenceColor = estimate.confidence === 'high' ? chalk.green : 
                           estimate.confidence === 'medium' ? chalk.yellow : chalk.red;
    console.log(`  Confidence: ${confidenceColor(estimate.confidence.toUpperCase())}`);
    
    console.log(chalk.blue('\nReasoning:'));
    estimate.reasoning.forEach(reason => {
      console.log(`  • ${reason}`);
    });
    
    this.logger.info('Price estimate generated', {
      tokenId,
      suggestedPrice: estimate.suggestedPrice,
      confidence: estimate.confidence
    });
    
    return estimate;
  }

  /**
   * Calculate fees for a given price
   */
  private async calculateFees(price?: number): Promise<any> {
    if (!price) {
      // Show fee structure
      const feeInfo = this.marketplaceInterface.getMarketplaceFees();
      
      console.log(chalk.green('💳 Marketplace Fee Structure:'));
      console.log(`  Total Fees: ${feeInfo.totalFees}%`);
      
      console.log(chalk.blue('\nFee Breakdown:'));
      feeInfo.feeBreakdown.forEach(fee => {
        console.log(`  ${fee.type}: ${fee.percentage}%`);
        console.log(`    ${fee.description}`);
      });
      
      console.log(chalk.yellow('\n💡 Use --price parameter to calculate fees for a specific sale price'));
      
      return feeInfo;
    } else {
      // Calculate fees for specific price
      const calculation = this.marketplaceInterface.calculateNetProceeds(price);
      
      console.log(chalk.green(`💳 Fee Calculation for ${price} microSTX:`));
      console.log(`  Gross Price: ${calculation.grossPrice} microSTX`);
      console.log(`  Royalty Fee: ${calculation.royaltyFee} microSTX`);
      console.log(`  Marketplace Fee: ${calculation.marketplaceFee} microSTX`);
      console.log(`  Total Fees: ${calculation.totalFees} microSTX (${calculation.feePercentage}%)`);
      console.log(chalk.blue(`  Net Proceeds: ${calculation.netProceeds} microSTX`));
      
      this.logger.info('Fee calculation completed', {
        price,
        totalFees: calculation.totalFees,
        netProceeds: calculation.netProceeds
      });
      
      return calculation;
    }
  }

  /**
   * Get collection ranking
   */
  private async getCollectionRanking(): Promise<any> {
    const ranking = await this.marketplaceInterface.getCollectionRanking();
    
    console.log(chalk.green('🏆 Collection Ranking:'));
    console.log(`  Rank: #${ranking.rank} of ${ranking.totalCollections} collections`);
    console.log(`  Overall Score: ${ranking.overallScore}/100`);
    
    console.log(chalk.blue('\nRanking Factors:'));
    ranking.rankingFactors.forEach(factor => {
      console.log(`  ${factor.factor}: ${factor.score}/100 (${factor.weight}% weight)`);
    });
    
    this.logger.info('Collection ranking retrieved', {
      rank: ranking.rank,
      totalCollections: ranking.totalCollections,
      overallScore: ranking.overallScore
    });
    
    return ranking;
  }

  /**
   * Save data to file
   */
  private saveData(data: any, outputFile: string, format?: string): void {
    try {
      let content: string;
      
      if (format === 'csv' && Array.isArray(data)) {
        // Convert to CSV format
        const headers = Object.keys(data[0] || {});
        content = headers.join(',') + '\n';
        data.forEach((row: any) => {
          content += headers.map(h => row[h] || '').join(',') + '\n';
        });
      } else {
        // Default to JSON format
        content = JSON.stringify(data, null, 2);
      }
      
      require('fs').writeFileSync(outputFile, content, 'utf-8');
      console.log(chalk.green('✅ Data saved to:'), outputFile);
      
    } catch (error: any) {
      console.log(chalk.red('❌ Failed to save data:'), error.message);
    }
  }
}