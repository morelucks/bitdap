/**
 * NFT Analytics Command
 * Handles analytics and reporting for NFT collections
 */

import { CommandDefinition } from '../../config/types.js';
import { AnalyticsEngine } from '../analytics/analytics-engine.js';
import { Logger } from '../../logging/logger.js';
import chalk from 'chalk';

export class AnalyticsNFTCommand {
  private analyticsEngine: AnalyticsEngine;
  private logger: Logger;

  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
    this.logger = Logger.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'nft-analytics',
      description: 'Generate analytics and reports for NFT collection',
      aliases: ['analytics-nft', 'nanalytics'],
      parameters: [
        {
          name: 'type',
          type: 'string',
          required: true,
          description: 'Analytics type: summary, collection, holders, velocity, revenue, health, export'
        },
        {
          name: 'output',
          type: 'string',
          required: false,
          description: 'Output file path for reports'
        },
        {
          name: 'format',
          type: 'string',
          required: false,
          description: 'Output format: json, csv (default: json)'
        },
        {
          name: 'days',
          type: 'number',
          required: false,
          description: 'Number of days for historical analysis (default: 30)'
        }
      ],
      examples: [
        'npm run token-interact nft-analytics --type summary',
        'npm run token-interact nft-analytics --type collection --output collection-report.json',
        'npm run token-interact analytics-nft --type holders --format csv --output holders.csv',
        'npm run token-interact nanalytics --type velocity --days 7',
        'npm run token-interact nft-analytics --type export --output full-report.json'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the analytics command
   */
  public async execute(args: any): Promise<any> {
    const { 
      type,
      output,
      format = 'json',
      days = 30
    } = args;

    try {
      console.log(chalk.blue('📊 Analytics type:'), type);

      let result: any;

      switch (type.toLowerCase()) {
        case 'summary':
          result = await this.generateSummary();
          break;

        case 'collection':
          result = await this.generateCollectionAnalytics(output, format);
          break;

        case 'holders':
        case 'holder-distribution':
          result = await this.generateHolderAnalytics(output, format);
          break;

        case 'velocity':
        case 'minting-velocity':
          result = await this.generateVelocityAnalytics(output, format, days);
          break;

        case 'revenue':
          result = await this.generateRevenueAnalytics(output, format, days);
          break;

        case 'health':
        case 'health-score':
          result = await this.generateHealthAnalytics(output, format);
          break;

        case 'export':
        case 'full-report':
          result = await this.exportFullReport(output || 'nft-analytics-report.json');
          break;

        default:
          throw new Error(`Unknown analytics type: ${type}. Available types: summary, collection, holders, velocity, revenue, health, export`);
      }

      return {
        success: true,
        data: result,
        message: `Analytics ${type} completed successfully`
      };

    } catch (error: any) {
      this.logger.error('NFT analytics command failed', {
        type,
        error: error.message
      });
      
      console.log(chalk.red('❌ Analytics failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Analytics operation failed'
      };
    }
  }

  /**
   * Generate analytics summary
   */
  private async generateSummary(): Promise<any> {
    console.log(chalk.blue('📋 Generating analytics summary...'));
    
    await this.analyticsEngine.displayAnalyticsSummary();
    
    this.logger.info('Analytics summary displayed');
    
    return {
      type: 'summary',
      displayed: true
    };
  }

  /**
   * Generate collection analytics
   */
  private async generateCollectionAnalytics(outputFile?: string, format?: string): Promise<any> {
    console.log(chalk.blue('📊 Generating collection analytics...'));
    
    const analytics = await this.analyticsEngine.generateCollectionAnalytics();
    
    if (outputFile) {
      this.saveAnalyticsData(analytics, outputFile, format);
    } else {
      this.displayCollectionAnalytics(analytics);
    }
    
    this.logger.info('Collection analytics generated', {
      outputFile,
      format,
      topHoldersCount: analytics.topHolders.length
    });
    
    return {
      type: 'collection',
      analytics,
      outputFile
    };
  }

  /**
   * Generate holder analytics
   */
  private async generateHolderAnalytics(outputFile?: string, format?: string): Promise<any> {
    console.log(chalk.blue('👥 Generating holder analytics...'));
    
    const holderData = await this.analyticsEngine.generateHolderDistribution();
    
    if (outputFile) {
      this.saveAnalyticsData(holderData, outputFile, format);
    } else {
      this.displayHolderAnalytics(holderData);
    }
    
    this.logger.info('Holder analytics generated', {
      outputFile,
      format,
      totalHolders: holderData.totalHolders
    });
    
    return {
      type: 'holders',
      holderData,
      outputFile
    };
  }

  /**
   * Generate velocity analytics
   */
  private async generateVelocityAnalytics(outputFile?: string, format?: string, days?: number): Promise<any> {
    console.log(chalk.blue('⚡ Generating minting velocity analytics...'));
    
    const velocityData = await this.analyticsEngine.generateMintingVelocity();
    
    if (outputFile) {
      this.saveAnalyticsData(velocityData, outputFile, format);
    } else {
      this.displayVelocityAnalytics(velocityData);
    }
    
    this.logger.info('Velocity analytics generated', {
      outputFile,
      format,
      days,
      currentVelocity: velocityData.currentVelocity
    });
    
    return {
      type: 'velocity',
      velocityData,
      outputFile
    };
  }

  /**
   * Generate revenue analytics
   */
  private async generateRevenueAnalytics(outputFile?: string, format?: string, days?: number): Promise<any> {
    console.log(chalk.blue('💰 Generating revenue analytics...'));
    
    const revenueData = await this.analyticsEngine.generateRevenueAnalytics();
    
    if (outputFile) {
      this.saveAnalyticsData(revenueData, outputFile, format);
    } else {
      this.displayRevenueAnalytics(revenueData);
    }
    
    this.logger.info('Revenue analytics generated', {
      outputFile,
      format,
      days,
      totalRevenue: revenueData.totalRevenue
    });
    
    return {
      type: 'revenue',
      revenueData,
      outputFile
    };
  }

  /**
   * Generate health analytics
   */
  private async generateHealthAnalytics(outputFile?: string, format?: string): Promise<any> {
    console.log(chalk.blue('🏥 Generating health score analytics...'));
    
    const healthData = await this.analyticsEngine.generateHealthScore();
    
    if (outputFile) {
      this.saveAnalyticsData(healthData, outputFile, format);
    } else {
      this.displayHealthAnalytics(healthData);
    }
    
    this.logger.info('Health analytics generated', {
      outputFile,
      format,
      overallScore: healthData.overallScore
    });
    
    return {
      type: 'health',
      healthData,
      outputFile
    };
  }

  /**
   * Export full analytics report
   */
  private async exportFullReport(outputFile: string): Promise<any> {
    console.log(chalk.blue('📄 Exporting full analytics report...'));
    
    await this.analyticsEngine.exportAnalyticsReport(outputFile);
    
    this.logger.info('Full analytics report exported', { outputFile });
    
    return {
      type: 'export',
      outputFile,
      exported: true
    };
  }

  /**
   * Display collection analytics
   */
  private displayCollectionAnalytics(analytics: any): void {
    console.log(chalk.green('\n📊 Collection Analytics:'));
    
    console.log(chalk.blue('\nMinting Trends:'));
    console.log(`  Peak Hour: ${analytics.mintingTrends.peakHour}:00`);
    console.log(`  Peak Day: ${analytics.mintingTrends.peakDay}`);
    console.log(`  Average per Day: ${analytics.mintingTrends.averagePerDay.toFixed(2)}`);
    
    console.log(chalk.blue('\nPrice Analytics:'));
    console.log(`  Average Mint Price: ${analytics.priceAnalytics.averageMintPrice} microSTX`);
    console.log(`  Total Revenue: ${analytics.priceAnalytics.totalRevenue} microSTX`);
    console.log(`  Projected Revenue: ${analytics.priceAnalytics.projectedRevenue} microSTX`);
    
    console.log(chalk.blue('\nTop Holders:'));
    analytics.topHolders.slice(0, 5).forEach((holder: any, index: number) => {
      console.log(`  ${index + 1}. ${holder.address}: ${holder.tokenCount} tokens (${holder.percentage}%)`);
    });
  }

  /**
   * Display holder analytics
   */
  private displayHolderAnalytics(holderData: any): void {
    console.log(chalk.green('\n👥 Holder Distribution:'));
    
    console.log(chalk.blue('\nOverview:'));
    console.log(`  Total Holders: ${holderData.totalHolders}`);
    console.log(`  Average Tokens per Holder: ${holderData.averageTokensPerHolder.toFixed(2)}`);
    
    console.log(chalk.blue('\nDistribution:'));
    holderData.holderDistribution.forEach((dist: any) => {
      console.log(`  ${dist.range}: ${dist.count} holders (${dist.percentage}%)`);
    });
    
    console.log(chalk.blue('\nTop Holders:'));
    holderData.topHolders.forEach((holder: any, index: number) => {
      console.log(`  ${index + 1}. ${holder.address}: ${holder.tokenCount} tokens (${holder.percentage}%)`);
    });
  }

  /**
   * Display velocity analytics
   */
  private displayVelocityAnalytics(velocityData: any): void {
    console.log(chalk.green('\n⚡ Minting Velocity:'));
    
    console.log(chalk.blue('\nVelocity Metrics:'));
    console.log(`  Current Velocity: ${velocityData.currentVelocity} tokens/day`);
    console.log(`  Peak Velocity: ${velocityData.peakVelocity} tokens/day`);
    console.log(`  Average Velocity: ${velocityData.averageVelocity.toFixed(2)} tokens/day`);
    console.log(`  Trend: ${velocityData.velocityTrend}`);
    
    const timeToSellOut = velocityData.timeToSellOut === Infinity ? 'Never' : `${Math.ceil(velocityData.timeToSellOut)} days`;
    console.log(`  Time to Sell Out: ${timeToSellOut}`);
    
    console.log(chalk.blue('\nRecent Daily Velocity:'));
    velocityData.dailyVelocity.slice(-7).forEach((day: any) => {
      console.log(`  ${day.date}: ${day.mints} mints`);
    });
  }

  /**
   * Display revenue analytics
   */
  private displayRevenueAnalytics(revenueData: any): void {
    console.log(chalk.green('\n💰 Revenue Analytics:'));
    
    console.log(chalk.blue('\nRevenue Overview:'));
    console.log(`  Total Revenue: ${revenueData.totalRevenue} microSTX`);
    console.log(`  Average Transaction Value: ${revenueData.averageTransactionValue} microSTX`);
    console.log(`  Royalty Revenue: ${revenueData.royaltyRevenue} microSTX`);
    
    console.log(chalk.blue('\nProjected Revenue:'));
    console.log(`  Daily: ${revenueData.projectedRevenue.daily} microSTX`);
    console.log(`  Weekly: ${revenueData.projectedRevenue.weekly} microSTX`);
    console.log(`  Monthly: ${revenueData.projectedRevenue.monthly} microSTX`);
    console.log(`  To Completion: ${revenueData.projectedRevenue.toCompletion} microSTX`);
    
    console.log(chalk.blue('\nRecent Daily Revenue:'));
    revenueData.revenueByDay.slice(-7).forEach((day: any) => {
      console.log(`  ${day.date}: ${day.revenue} microSTX (${day.transactions} transactions)`);
    });
  }

  /**
   * Display health analytics
   */
  private displayHealthAnalytics(healthData: any): void {
    console.log(chalk.green('\n🏥 Collection Health Score:'));
    
    const scoreColor = healthData.overallScore >= 80 ? chalk.green : 
                      healthData.overallScore >= 60 ? chalk.yellow : chalk.red;
    console.log(`  Overall Score: ${scoreColor(healthData.overallScore)}/100`);
    
    console.log(chalk.blue('\nMetric Breakdown:'));
    Object.entries(healthData.metrics).forEach(([key, metric]: [string, any]) => {
      const statusColor = metric.status === 'Good' ? chalk.green : 
                         metric.status === 'Fair' ? chalk.yellow : chalk.red;
      console.log(`  ${key}: ${statusColor(metric.status)} (${metric.score}/100)`);
    });
    
    if (healthData.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      healthData.recommendations.forEach((rec: string) => {
        console.log(chalk.yellow(`  • ${rec}`));
      });
    }
  }

  /**
   * Save analytics data to file
   */
  private saveAnalyticsData(data: any, outputFile: string, format?: string): void {
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
      console.log(chalk.green('✅ Analytics data saved to:'), outputFile);
      
    } catch (error: any) {
      console.log(chalk.red('❌ Failed to save analytics data:'), error.message);
    }
  }
}