/**
 * NFT Metadata Command
 * Handles metadata creation, validation, and management
 */

import { CommandDefinition } from '../../config/types.js';
import { MetadataManager } from '../metadata/metadata-manager.js';
import { Logger } from '../../logging/logger.js';
import { MetadataStandard } from '../types.js';
import chalk from 'chalk';

export class MetadataNFTCommand {
  private metadataManager: MetadataManager;
  private logger: Logger;

  constructor() {
    this.metadataManager = new MetadataManager();
    this.logger = Logger.getInstance();
  }

  /**
   * Get command definition
   */
  public getDefinition(): CommandDefinition {
    return {
      name: 'nft-metadata',
      description: 'Create and manage NFT metadata',
      aliases: ['metadata-nft', 'nmeta'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Metadata action: create, validate, batch, template, rarity'
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: 'NFT name'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'NFT description'
        },
        {
          name: 'image',
          type: 'string',
          required: false,
          description: 'Image URL'
        },
        {
          name: 'external-url',
          type: 'string',
          required: false,
          description: 'External URL'
        },
        {
          name: 'animation-url',
          type: 'string',
          required: false,
          description: 'Animation URL'
        },
        {
          name: 'background-color',
          type: 'string',
          required: false,
          description: 'Background color (hex without #)'
        },
        {
          name: 'attributes',
          type: 'string',
          required: false,
          description: 'JSON string of attributes array'
        },
        {
          name: 'file',
          type: 'string',
          required: false,
          description: 'Input/output file path'
        },
        {
          name: 'output',
          type: 'string',
          required: false,
          description: 'Output file or directory path'
        },
        {
          name: 'count',
          type: 'number',
          required: false,
          description: 'Number of metadata files to generate (for batch)'
        },
        {
          name: 'base-name',
          type: 'string',
          required: false,
          description: 'Base name for batch generation'
        },
        {
          name: 'base-image-url',
          type: 'string',
          required: false,
          description: 'Base image URL for batch generation'
        },
        {
          name: 'name-pattern',
          type: 'string',
          required: false,
          description: 'Name pattern for batch (e.g., "{baseName} #{tokenId}")'
        },
        {
          name: 'image-pattern',
          type: 'string',
          required: false,
          description: 'Image URL pattern for batch (e.g., "{baseImageUrl}/{tokenId}.png")'
        }
      ],
      examples: [
        'npm run token-interact nft-metadata --action create --name "My NFT" --description "Cool NFT" --image "https://example.com/1.png" --output metadata.json',
        'npm run token-interact nft-metadata --action validate --file metadata.json',
        'npm run token-interact nft-metadata --action batch --count 100 --base-name "Cool NFT" --base-image-url "https://example.com" --output ./metadata',
        'npm run token-interact metadata-nft --action template --output template.json',
        'npm run token-interact nmeta --action rarity --file collection-metadata.json'
      ],
      handler: this.execute.bind(this)
    };
  }

  /**
   * Execute the metadata command
   */
  public async execute(args: any): Promise<any> {
    const { 
      action,
      name,
      description,
      image,
      'external-url': externalUrl,
      'animation-url': animationUrl,
      'background-color': backgroundColor,
      attributes,
      file,
      output,
      count,
      'base-name': baseName,
      'base-image-url': baseImageUrl,
      'name-pattern': namePattern,
      'image-pattern': imagePattern
    } = args;

    try {
      console.log(chalk.blue('📄 Metadata action:'), action);

      let result: any;

      switch (action.toLowerCase()) {
        case 'create':
          result = await this.createMetadata({
            name,
            description,
            image,
            externalUrl,
            animationUrl,
            backgroundColor,
            attributes,
            output
          });
          break;

        case 'validate':
          result = await this.validateMetadata(file);
          break;

        case 'batch':
          result = await this.generateBatchMetadata({
            count,
            baseName,
            description,
            baseImageUrl,
            namePattern,
            imagePattern,
            attributes,
            output
          });
          break;

        case 'template':
          result = await this.createTemplate(output);
          break;

        case 'rarity':
          result = await this.calculateRarity(file);
          break;

        default:
          throw new Error(`Unknown metadata action: ${action}. Available actions: create, validate, batch, template, rarity`);
      }

      return {
        success: true,
        data: result,
        message: `Metadata ${action} completed successfully`
      };

    } catch (error: any) {
      this.logger.error('NFT metadata command failed', {
        action,
        error: error.message
      });
      
      console.log(chalk.red('❌ Metadata action failed:'), error.message);
      
      return {
        success: false,
        error: {
          code: 'METADATA_ERROR',
          message: error.message,
          category: 'system'
        },
        message: 'Metadata operation failed'
      };
    }
  }

  /**
   * Create single metadata file
   */
  private async createMetadata(options: {
    name?: string;
    description?: string;
    image?: string;
    externalUrl?: string;
    animationUrl?: string;
    backgroundColor?: string;
    attributes?: string;
    output?: string;
  }): Promise<any> {
    if (!options.name || !options.description || !options.image) {
      throw new Error('Name, description, and image are required for metadata creation');
    }

    // Parse attributes if provided
    let parsedAttributes;
    if (options.attributes) {
      try {
        parsedAttributes = JSON.parse(options.attributes);
        if (!Array.isArray(parsedAttributes)) {
          throw new Error('Attributes must be an array');
        }
      } catch (error) {
        throw new Error('Invalid attributes JSON format');
      }
    }

    const metadata = this.metadataManager.createMetadata({
      name: options.name,
      description: options.description,
      image: options.image,
      externalUrl: options.externalUrl,
      animationUrl: options.animationUrl,
      backgroundColor: options.backgroundColor,
      attributes: parsedAttributes
    });

    // Validate created metadata
    const validation = this.metadataManager.validateMetadata(metadata);
    
    if (!validation.valid) {
      console.log(chalk.red('❌ Metadata validation failed:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
      throw new Error('Generated metadata is invalid');
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Metadata warnings:'));
      validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`  - ${warning}`));
      });
    }

    // Save to file if output specified
    if (options.output) {
      this.metadataManager.saveMetadata(metadata, options.output);
    } else {
      console.log(chalk.green('✅ Metadata created:'));
      console.log(JSON.stringify(metadata, null, 2));
    }

    this.logger.info('Metadata created', {
      name: metadata.name,
      hasAttributes: !!metadata.attributes,
      outputFile: options.output
    });

    return {
      metadata,
      validation,
      outputFile: options.output
    };
  }

  /**
   * Validate metadata file
   */
  private async validateMetadata(filePath?: string): Promise<any> {
    if (!filePath) {
      throw new Error('File path is required for metadata validation');
    }

    const metadata = this.metadataManager.loadMetadata(filePath);
    const validation = this.metadataManager.validateMetadata(metadata);

    console.log(chalk.blue('📄 Validating metadata:'), filePath);
    
    if (validation.valid) {
      console.log(chalk.green('✅ Metadata is valid!'));
    } else {
      console.log(chalk.red('❌ Metadata validation failed:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`  - ${warning}`));
      });
    }

    this.logger.info('Metadata validated', {
      filePath,
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    });

    return {
      metadata,
      validation,
      filePath
    };
  }

  /**
   * Generate batch metadata
   */
  private async generateBatchMetadata(options: {
    count?: number;
    baseName?: string;
    description?: string;
    baseImageUrl?: string;
    namePattern?: string;
    imagePattern?: string;
    attributes?: string;
    output?: string;
  }): Promise<any> {
    if (!options.count || !options.baseName || !options.baseImageUrl) {
      throw new Error('Count, base name, and base image URL are required for batch generation');
    }

    if (options.count > 10000) {
      throw new Error('Maximum batch size is 10,000 metadata files');
    }

    // Parse attributes if provided
    let parsedAttributes;
    if (options.attributes) {
      try {
        parsedAttributes = JSON.parse(options.attributes);
      } catch (error) {
        throw new Error('Invalid attributes JSON format');
      }
    }

    console.log(chalk.blue(`🔄 Generating ${options.count} metadata files...`));

    const metadataList = this.metadataManager.generateBatchMetadata({
      baseName: options.baseName,
      baseDescription: options.description || `${options.baseName} NFT Collection`,
      baseImageUrl: options.baseImageUrl,
      count: options.count,
      namePattern: options.namePattern,
      imagePattern: options.imagePattern,
      attributes: parsedAttributes
    });

    // Validate all generated metadata
    let validCount = 0;
    let invalidCount = 0;
    
    metadataList.forEach((metadata, index) => {
      const validation = this.metadataManager.validateMetadata(metadata);
      if (validation.valid) {
        validCount++;
      } else {
        invalidCount++;
        console.log(chalk.red(`❌ Invalid metadata for token ${index + 1}:`));
        validation.errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
      }
    });

    console.log(chalk.blue('📊 Batch Generation Summary:'));
    console.log(`  Total: ${metadataList.length}`);
    console.log(chalk.green(`  Valid: ${validCount}`));
    console.log(chalk.red(`  Invalid: ${invalidCount}`));

    // Save to directory if output specified
    if (options.output) {
      this.metadataManager.saveBatchMetadata(metadataList, options.output);
    }

    this.logger.info('Batch metadata generated', {
      count: options.count,
      validCount,
      invalidCount,
      outputDir: options.output
    });

    return {
      metadataList,
      count: metadataList.length,
      validCount,
      invalidCount,
      outputDir: options.output
    };
  }

  /**
   * Create metadata template
   */
  private async createTemplate(outputFile?: string): Promise<any> {
    const template = this.metadataManager.createTemplate();
    
    if (outputFile) {
      this.metadataManager.saveMetadata(template, outputFile);
    } else {
      console.log(chalk.green('📄 Metadata Template:'));
      console.log(JSON.stringify(template, null, 2));
    }

    this.logger.info('Metadata template created', { outputFile });

    return {
      template,
      outputFile
    };
  }

  /**
   * Calculate rarity for collection
   */
  private async calculateRarity(filePath?: string): Promise<any> {
    if (!filePath) {
      throw new Error('File path is required for rarity calculation');
    }

    // This would load a collection of metadata files
    // For now, just load and analyze a single file
    const metadata = this.metadataManager.loadMetadata(filePath);
    
    console.log(chalk.blue('🎯 Analyzing rarity for:'), metadata.name);
    
    if (!metadata.attributes || metadata.attributes.length === 0) {
      console.log(chalk.yellow('⚠️  No attributes found for rarity analysis'));
      return {
        metadata,
        hasAttributes: false
      };
    }

    console.log(chalk.green('📊 Attributes:'));
    metadata.attributes.forEach(attr => {
      console.log(`  ${attr.trait_type}: ${attr.value}`);
    });

    // For a full rarity calculation, we would need the entire collection
    console.log(chalk.yellow('💡 For complete rarity analysis, provide a directory of metadata files'));

    this.logger.info('Rarity analysis performed', {
      filePath,
      attributeCount: metadata.attributes.length
    });

    return {
      metadata,
      hasAttributes: true,
      attributeCount: metadata.attributes.length,
      attributes: metadata.attributes
    };
  }
}