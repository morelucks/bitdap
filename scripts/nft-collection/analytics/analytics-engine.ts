/**
 * NFT Analytics Engine
 * Provides analytics and reporting for NFT collections
 */

import { NFTContractInterface } from '../nft-contract-interface.js';
import { Logger } from '../../logging/logger.js';
import { CollectionAnalytics, TokenDetails } from '../types.js';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

export class AnalyticsEngine {
  private contractInterface: NFTContractInterface;
  private logger: Logger;

  constructor() {
    this.contractInterface = new NFTContractInterface();
    this.logger = Logger.getInstance();
  }

  /**
   * Generate comprehensive collection analytics
   */
  public async generateCollectionAnalytics(): Promise<CollectionAnalytics> {
    console.log(chalk.blue('📊 Generating collection analytics...'));

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    
    if (!collectionInfo || !mintInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    // Simulate analytics data (in real implementation, this would query blockchain events)
    const analytics: CollectionAnalytics = {
      dailyMints: this.generateDailyMints(30), // Last 30 days
      dailyTransfers: this.generateDailyTransfers(30),
      topHolders: await this.getTopHolders(),
      mintingTrends: {
        peakHour: 14, // 2 PM
        peakDay: 'Saturday',
        averagePerDay: collectionInfo.totalSupply / 30
      },
      priceAnalytics: {
        averageMintPrice: mintInfo.price,
        totalRevenue: mintInfo.price * collectionInfo.totalSupply,
        projectedRevenue: mintInfo.price * collectionInfo.maxSupply
      }
    };

    this.logger.info('Collection analytics generated', {
      totalSupply: collectionInfo.totalSupply,
      topHoldersCount: analytics.topHolders.length,
      totalRevenue: analytics.priceAnalytics.totalRevenue
    });

    return analytics;
  }

  /**
   * Generate holder distribution report
   */
  public async generateHolderDistribution(): Promise<{
    totalHolders: number;
    averageTokensPerHolder: number;
    holderDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    topHolders: Array<{
      address: string;
      tokenCount: number;
      percentage: number;
    }>;
  }> {
    console.log(chalk.blue('👥 Analyzing holder distribution...'));

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    if (!collectionInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    // Simulate holder data (in real implementation, this would analyze all token owners)
    const totalHolders = Math.floor(collectionInfo.totalSupply * 0.7); // Assume 70% unique holders
    const averageTokensPerHolder = collectionInfo.totalSupply / totalHolders;

    const holderDistribution = [
      { range: '1 token', count: Math.floor(totalHolders * 0.6), percentage: 60 },
      { range: '2-5 tokens', count: Math.floor(totalHolders * 0.25), percentage: 25 },
      { range: '6-10 tokens', count: Math.floor(totalHolders * 0.1), percentage: 10 },
      { range: '11+ tokens', count: Math.floor(totalHolders * 0.05), percentage: 5 }
    ];

    const topHolders = await this.getTopHolders();

    this.logger.info('Holder distribution analyzed', {
      totalHolders,
      averageTokensPerHolder,
      topHoldersCount: topHolders.length
    });

    return {
      totalHolders,
      averageTokensPerHolder,
      holderDistribution,
      topHolders
    };
  }

  /**
   * Generate minting velocity report
   */
  public async generateMintingVelocity(): Promise<{
    currentVelocity: number; // tokens per day
    peakVelocity: number;
    averageVelocity: number;
    velocityTrend: 'increasing' | 'decreasing' | 'stable';
    timeToSellOut: number; // days
    dailyVelocity: Array<{
      date: string;
      mints: number;
    }>;
  }> {
    console.log(chalk.blue('⚡ Analyzing minting velocity...'));

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    if (!collectionInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    const dailyMints = this.generateDailyMints(30);
    const currentVelocity = dailyMints[dailyMints.length - 1] || 0;
    const peakVelocity = Math.max(...dailyMints);
    const averageVelocity = dailyMints.reduce((sum, mints) => sum + mints, 0) / dailyMints.length;
    
    // Determine trend
    const recentAverage = dailyMints.slice(-7).reduce((sum, mints) => sum + mints, 0) / 7;
    const olderAverage = dailyMints.slice(-14, -7).reduce((sum, mints) => sum + mints, 0) / 7;
    
    let velocityTrend: 'increasing' | 'decreasing' | 'stable';
    if (recentAverage > olderAverage * 1.1) {
      velocityTrend = 'increasing';
    } else if (recentAverage < olderAverage * 0.9) {
      velocityTrend = 'decreasing';
    } else {
      velocityTrend = 'stable';
    }

    const remainingSupply = collectionInfo.maxSupply - collectionInfo.totalSupply;
    const timeToSellOut = currentVelocity > 0 ? remainingSupply / currentVelocity : Infinity;

    const dailyVelocity = dailyMints.map((mints, index) => ({
      date: new Date(Date.now() - (dailyMints.length - index - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mints
    }));

    this.logger.info('Minting velocity analyzed', {
      currentVelocity,
      peakVelocity,
      averageVelocity,
      velocityTrend,
      timeToSellOut: timeToSellOut === Infinity ? 'Never' : `${Math.ceil(timeToSellOut)} days`
    });

    return {
      currentVelocity,
      peakVelocity,
      averageVelocity,
      velocityTrend,
      timeToSellOut,
      dailyVelocity
    };
  }

  /**
   * Generate revenue analytics
   */
  public async generateRevenueAnalytics(): Promise<{
    totalRevenue: number;
    averageTransactionValue: number;
    revenueByDay: Array<{
      date: string;
      revenue: number;
      transactions: number;
    }>;
    projectedRevenue: {
      daily: number;
      weekly: number;
      monthly: number;
      toCompletion: number;
    };
    royaltyRevenue: number;
  }> {
    console.log(chalk.blue('💰 Analyzing revenue...'));

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    const royaltyInfo = await this.contractInterface.getRoyaltyInfo();
    
    if (!collectionInfo || !mintInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    const totalRevenue = mintInfo.price * collectionInfo.totalSupply;
    const averageTransactionValue = mintInfo.price;
    
    const dailyMints = this.generateDailyMints(30);
    const revenueByDay = dailyMints.map((mints, index) => ({
      date: new Date(Date.now() - (dailyMints.length - index - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: mints * mintInfo.price,
      transactions: mints
    }));

    const recentDailyAverage = dailyMints.slice(-7).reduce((sum, mints) => sum + mints, 0) / 7;
    const projectedRevenue = {
      daily: recentDailyAverage * mintInfo.price,
      weekly: recentDailyAverage * 7 * mintInfo.price,
      monthly: recentDailyAverage * 30 * mintInfo.price,
      toCompletion: (collectionInfo.maxSupply - collectionInfo.totalSupply) * mintInfo.price
    };

    const royaltyRevenue = royaltyInfo?.totalCollected || 0;

    this.logger.info('Revenue analytics generated', {
      totalRevenue,
      averageTransactionValue,
      projectedDailyRevenue: projectedRevenue.daily,
      royaltyRevenue
    });

    return {
      totalRevenue,
      averageTransactionValue,
      revenueByDay,
      projectedRevenue,
      royaltyRevenue
    };
  }

  /**
   * Generate collection health score
   */
  public async generateHealthScore(): Promise<{
    overallScore: number; // 0-100
    metrics: {
      mintingActivity: { score: number; status: string };
      holderDistribution: { score: number; status: string };
      priceStability: { score: number; status: string };
      communityEngagement: { score: number; status: string };
    };
    recommendations: string[];
  }> {
    console.log(chalk.blue('🏥 Calculating collection health score...'));

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    
    if (!collectionInfo || !mintInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    // Calculate individual metric scores
    const mintingProgress = (collectionInfo.totalSupply / collectionInfo.maxSupply) * 100;
    const mintingActivity = {
      score: Math.min(mintingProgress * 2, 100), // Higher score for more minting progress
      status: mintingProgress > 50 ? 'Good' : mintingProgress > 20 ? 'Fair' : 'Poor'
    };

    const holderDistribution = {
      score: 75, // Simulated - would calculate based on actual holder diversity
      status: 'Good'
    };

    const priceStability = {
      score: mintInfo.price > 0 ? 80 : 60, // Higher score if there's a mint price
      status: mintInfo.price > 0 ? 'Good' : 'Fair'
    };

    const communityEngagement = {
      score: 70, // Simulated - would calculate based on transfer activity
      status: 'Good'
    };

    const overallScore = Math.round(
      (mintingActivity.score + holderDistribution.score + priceStability.score + communityEngagement.score) / 4
    );

    const recommendations: string[] = [];
    
    if (mintingActivity.score < 50) {
      recommendations.push('Consider marketing campaigns to increase minting activity');
    }
    
    if (holderDistribution.score < 60) {
      recommendations.push('Encourage broader distribution to avoid whale concentration');
    }
    
    if (priceStability.score < 70) {
      recommendations.push('Consider implementing a mint price to establish value');
    }
    
    if (communityEngagement.score < 60) {
      recommendations.push('Increase community engagement through social media and events');
    }

    if (recommendations.length === 0) {
      recommendations.push('Collection health is good! Continue current strategies.');
    }

    this.logger.info('Health score calculated', {
      overallScore,
      mintingActivityScore: mintingActivity.score,
      holderDistributionScore: holderDistribution.score,
      recommendationCount: recommendations.length
    });

    return {
      overallScore,
      metrics: {
        mintingActivity,
        holderDistribution,
        priceStability,
        communityEngagement
      },
      recommendations
    };
  }

  /**
   * Export analytics report
   */
  public async exportAnalyticsReport(outputPath: string): Promise<void> {
    console.log(chalk.blue('📄 Generating comprehensive analytics report...'));

    const [
      collectionAnalytics,
      holderDistribution,
      mintingVelocity,
      revenueAnalytics,
      healthScore
    ] = await Promise.all([
      this.generateCollectionAnalytics(),
      this.generateHolderDistribution(),
      this.generateMintingVelocity(),
      this.generateRevenueAnalytics(),
      this.generateHealthScore()
    ]);

    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();

    const report = {
      generatedAt: new Date().toISOString(),
      collection: collectionInfo,
      minting: mintInfo,
      analytics: collectionAnalytics,
      holders: holderDistribution,
      velocity: mintingVelocity,
      revenue: revenueAnalytics,
      health: healthScore
    };

    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    console.log(chalk.green('✅ Analytics report exported to:'), outputPath);
    
    this.logger.info('Analytics report exported', {
      outputPath,
      reportSections: Object.keys(report).length,
      overallHealthScore: healthScore.overallScore
    });
  }

  /**
   * Display analytics summary
   */
  public async displayAnalyticsSummary(): Promise<void> {
    const collectionInfo = await this.contractInterface.getCollectionInfo();
    const mintInfo = await this.contractInterface.getMintInfo();
    const healthScore = await this.generateHealthScore();
    
    if (!collectionInfo || !mintInfo) {
      throw new Error('Failed to retrieve collection information');
    }

    console.log(chalk.blue('\n📊 Collection Analytics Summary\n'));
    
    console.log(chalk.green('Collection Overview:'));
    console.log(`  Name: ${collectionInfo.name}`);
    console.log(`  Total Supply: ${collectionInfo.totalSupply}/${collectionInfo.maxSupply}`);
    console.log(`  Minting Progress: ${((collectionInfo.totalSupply / collectionInfo.maxSupply) * 100).toFixed(2)}%`);
    console.log(`  Mint Price: ${mintInfo.price} microSTX`);
    
    console.log(chalk.green('\nHealth Score:'));
    const scoreColor = healthScore.overallScore >= 80 ? chalk.green : 
                      healthScore.overallScore >= 60 ? chalk.yellow : chalk.red;
    console.log(`  Overall: ${scoreColor(healthScore.overallScore)}/100`);
    
    console.log(chalk.green('\nKey Metrics:'));
    Object.entries(healthScore.metrics).forEach(([key, metric]) => {
      const statusColor = metric.status === 'Good' ? chalk.green : 
                         metric.status === 'Fair' ? chalk.yellow : chalk.red;
      console.log(`  ${key}: ${statusColor(metric.status)} (${metric.score}/100)`);
    });
    
    if (healthScore.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      healthScore.recommendations.forEach(rec => {
        console.log(chalk.yellow(`  • ${rec}`));
      });
    }
  }

  /**
   * Private helper methods
   */
  private generateDailyMints(days: number): number[] {
    // Simulate daily mint data with some randomness
    const mints: number[] = [];
    for (let i = 0; i < days; i++) {
      const baseMints = Math.floor(Math.random() * 50) + 10; // 10-60 mints per day
      mints.push(baseMints);
    }
    return mints;
  }

  private generateDailyTransfers(days: number): number[] {
    // Simulate daily transfer data
    const transfers: number[] = [];
    for (let i = 0; i < days; i++) {
      const baseTransfers = Math.floor(Math.random() * 20) + 5; // 5-25 transfers per day
      transfers.push(baseTransfers);
    }
    return transfers;
  }

  private async getTopHolders(): Promise<Array<{
    address: string;
    tokenCount: number;
    percentage: number;
  }>> {
    // Simulate top holders data
    const totalSupply = 1000; // Simulated
    return [
      { address: 'ST1HOLDER1...', tokenCount: 50, percentage: 5.0 },
      { address: 'ST1HOLDER2...', tokenCount: 35, percentage: 3.5 },
      { address: 'ST1HOLDER3...', tokenCount: 25, percentage: 2.5 },
      { address: 'ST1HOLDER4...', tokenCount: 20, percentage: 2.0 },
      { address: 'ST1HOLDER5...', tokenCount: 15, percentage: 1.5 }
    ];
  }
}