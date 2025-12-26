/**
 * NFT Metadata Manager
 * Handles metadata creation, validation, and IPFS integration
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { MetadataStandard, IPFSMetadata } from '../types.js';
import { Logger } from '../../logging/logger.js';
import chalk from 'chalk';

export class MetadataManager {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Create standard NFT metadata
   */
  public createMetadata(options: {
    name: string;
    description: string;
    image: string;
    externalUrl?: string;
    animationUrl?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
    backgroundColor?: string;
    youtubeUrl?: string;
  }): MetadataStandard {
    const metadata: MetadataStandard = {
      name: options.name,
      description: options.description,
      image: options.image
    };

    if (options.externalUrl) {
      metadata.external_url = options.externalUrl;
    }

    if (options.animationUrl) {
      metadata.animation_url = options.animationUrl;
    }

    if (options.attributes && options.attributes.length > 0) {
      metadata.attributes = options.attributes;
    }

    if (options.backgroundColor) {
      metadata.background_color = options.backgroundColor;
    }

    if (options.youtubeUrl) {
      metadata.youtube_url = options.youtubeUrl;
    }

    this.logger.info('NFT metadata created', {
      name: metadata.name,
      hasAttributes: !!metadata.attributes,
      attributeCount: metadata.attributes?.length || 0
    });

    return metadata;
  }

  /**
   * Validate metadata against OpenSea standard
   */
  public validateMetadata(metadata: MetadataStandard): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push('Image URL is required');
    }

    // Validate URLs
    if (metadata.image && !this.isValidUrl(metadata.image)) {
      errors.push('Image must be a valid URL');
    }

    if (metadata.external_url && !this.isValidUrl(metadata.external_url)) {
      errors.push('External URL must be a valid URL');
    }

    if (metadata.animation_url && !this.isValidUrl(metadata.animation_url)) {
      errors.push('Animation URL must be a valid URL');
    }

    if (metadata.youtube_url && !this.isValidUrl(metadata.youtube_url)) {
      errors.push('YouTube URL must be a valid URL');
    }

    // Validate attributes
    if (metadata.attributes) {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || attr.trait_type.trim().length === 0) {
          errors.push(`Attribute ${index + 1}: trait_type is required`);
        }

        if (attr.value === undefined || attr.value === null) {
          errors.push(`Attribute ${index + 1}: value is required`);
        }

        if (attr.display_type && !['number', 'boost_number', 'boost_percentage', 'date'].includes(attr.display_type)) {
          warnings.push(`Attribute ${index + 1}: unknown display_type "${attr.display_type}"`);
        }
      });
    }

    // Validate background color
    if (metadata.background_color && !this.isValidHexColor(metadata.background_color)) {
      errors.push('Background color must be a valid hex color (without #)');
    }

    // Length warnings
    if (metadata.name && metadata.name.length > 50) {
      warnings.push('Name is longer than 50 characters, may be truncated in some displays');
    }

    if (metadata.description && metadata.description.length > 1000) {
      warnings.push('Description is longer than 1000 characters, may be truncated in some displays');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate batch metadata
   */
  public generateBatchMetadata(options: {
    baseName: string;
    baseDescription: string;
    baseImageUrl: string;
    count: number;
    attributes?: Array<{
      trait_type: string;
      values: (string | number)[];
      weights?: number[];
    }>;
    namePattern?: string; // e.g., "{baseName} #{tokenId}"
    descriptionPattern?: string;
    imagePattern?: string; // e.g., "{baseImageUrl}/{tokenId}.png"
  }): MetadataStandard[] {
    const metadataList: MetadataStandard[] = [];

    for (let i = 1; i <= options.count; i++) {
      const tokenId = i;
      
      // Generate name
      const name = options.namePattern 
        ? options.namePattern
            .replace('{baseName}', options.baseName)
            .replace('{tokenId}', tokenId.toString())
        : `${options.baseName} #${tokenId}`;

      // Generate description
      const description = options.descriptionPattern
        ? options.descriptionPattern
            .replace('{baseName}', options.baseName)
            .replace('{tokenId}', tokenId.toString())
        : options.baseDescription;

      // Generate image URL
      const image = options.imagePattern
        ? options.imagePattern
            .replace('{baseImageUrl}', options.baseImageUrl)
            .replace('{tokenId}', tokenId.toString())
        : `${options.baseImageUrl}/${tokenId}.png`;

      // Generate attributes
      let attributes: Array<{
        trait_type: string;
        value: string | number;
        display_type?: string;
      }> | undefined;

      if (options.attributes) {
        attributes = options.attributes.map(attr => {
          const value = this.selectRandomValue(attr.values, attr.weights);
          return {
            trait_type: attr.trait_type,
            value
          };
        });
      }

      const metadata = this.createMetadata({
        name,
        description,
        image,
        attributes
      });

      metadataList.push(metadata);
    }

    this.logger.info('Batch metadata generated', {
      count: options.count,
      hasAttributes: !!options.attributes,
      attributeTypes: options.attributes?.length || 0
    });

    return metadataList;
  }

  /**
   * Save metadata to file
   */
  public saveMetadata(metadata: MetadataStandard, filePath: string): void {
    try {
      const jsonContent = JSON.stringify(metadata, null, 2);
      writeFileSync(filePath, jsonContent, 'utf-8');
      
      console.log(chalk.green('✅ Metadata saved to:'), filePath);
      
      this.logger.info('Metadata saved to file', {
        filePath,
        name: metadata.name
      });
    } catch (error: any) {
      console.log(chalk.red('❌ Failed to save metadata:'), error.message);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
  }

  /**
   * Load metadata from file
   */
  public loadMetadata(filePath: string): MetadataStandard {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`Metadata file not found: ${filePath}`);
      }

      const jsonContent = readFileSync(filePath, 'utf-8');
      const metadata = JSON.parse(jsonContent) as MetadataStandard;
      
      // Validate loaded metadata
      const validation = this.validateMetadata(metadata);
      if (!validation.valid) {
        console.log(chalk.yellow('⚠️  Metadata validation warnings:'));
        validation.errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`  - ${warning}`));
        });
      }

      this.logger.info('Metadata loaded from file', {
        filePath,
        name: metadata.name,
        valid: validation.valid
      });

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to load metadata: ${error.message}`);
    }
  }

  /**
   * Save batch metadata to directory
   */
  public saveBatchMetadata(metadataList: MetadataStandard[], outputDir: string): void {
    try {
      // Create directory if it doesn't exist
      if (!existsSync(outputDir)) {
        require('fs').mkdirSync(outputDir, { recursive: true });
      }

      metadataList.forEach((metadata, index) => {
        const tokenId = index + 1;
        const filePath = `${outputDir}/${tokenId}.json`;
        this.saveMetadata(metadata, filePath);
      });

      console.log(chalk.green(`✅ Batch metadata saved: ${metadataList.length} files in ${outputDir}`));
      
      this.logger.info('Batch metadata saved', {
        count: metadataList.length,
        outputDir
      });
    } catch (error: any) {
      throw new Error(`Failed to save batch metadata: ${error.message}`);
    }
  }

  /**
   * Create metadata template
   */
  public createTemplate(): MetadataStandard {
    return {
      name: "NFT Name",
      description: "Description of your NFT",
      image: "https://example.com/image.png",
      external_url: "https://example.com",
      attributes: [
        {
          trait_type: "Rarity",
          value: "Common"
        },
        {
          trait_type: "Level",
          value: 1,
          display_type: "number"
        },
        {
          trait_type: "Power",
          value: 85,
          display_type: "boost_percentage"
        }
      ],
      background_color: "ffffff"
    };
  }

  /**
   * Generate rarity-based attributes
   */
  public generateRarityAttributes(rarityConfig: {
    [traitType: string]: {
      values: Array<{
        value: string | number;
        rarity: number; // 0-100 percentage
      }>;
    };
  }): Array<{
    trait_type: string;
    value: string | number;
  }> {
    const attributes: Array<{
      trait_type: string;
      value: string | number;
    }> = [];

    Object.entries(rarityConfig).forEach(([traitType, config]) => {
      const randomValue = Math.random() * 100;
      let cumulativeRarity = 0;
      
      for (const item of config.values) {
        cumulativeRarity += item.rarity;
        if (randomValue <= cumulativeRarity) {
          attributes.push({
            trait_type: traitType,
            value: item.value
          });
          break;
        }
      }
    });

    return attributes;
  }

  /**
   * Calculate rarity score for metadata
   */
  public calculateRarityScore(
    metadata: MetadataStandard,
    collectionMetadata: MetadataStandard[]
  ): {
    totalScore: number;
    traitScores: Array<{
      trait_type: string;
      value: string | number;
      rarity: number;
      score: number;
    }>;
    rank: number;
  } {
    if (!metadata.attributes || !collectionMetadata.length) {
      return { totalScore: 0, traitScores: [], rank: 0 };
    }

    const traitScores: Array<{
      trait_type: string;
      value: string | number;
      rarity: number;
      score: number;
    }> = [];

    let totalScore = 0;

    metadata.attributes.forEach(attr => {
      // Count occurrences of this trait value in the collection
      const occurrences = collectionMetadata.filter(meta => 
        meta.attributes?.some(a => 
          a.trait_type === attr.trait_type && a.value === attr.value
        )
      ).length;

      const rarity = (occurrences / collectionMetadata.length) * 100;
      const score = 1 / (occurrences / collectionMetadata.length);

      traitScores.push({
        trait_type: attr.trait_type,
        value: attr.value,
        rarity,
        score
      });

      totalScore += score;
    });

    // Calculate rank (1 = rarest)
    const allScores = collectionMetadata.map(meta => 
      this.calculateRarityScore(meta, collectionMetadata).totalScore
    ).sort((a, b) => b - a);

    const rank = allScores.indexOf(totalScore) + 1;

    return {
      totalScore,
      traitScores,
      rank
    };
  }

  /**
   * Private helper methods
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidHexColor(color: string): boolean {
    return /^[0-9A-Fa-f]{6}$/.test(color);
  }

  private selectRandomValue(values: (string | number)[], weights?: number[]): string | number {
    if (!weights || weights.length !== values.length) {
      // Equal probability
      return values[Math.floor(Math.random() * values.length)];
    }

    // Weighted selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    for (let i = 0; i < values.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        return values[i];
      }
    }

    return values[values.length - 1];
  }
}