/**
 * Output Formatter
 * Handles formatting output in different formats (JSON, table, CSV)
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { ConfigManager } from '../config/config-manager.js';

export interface FormattedOutput {
  success: boolean;
  data?: any;
  message?: string;
  error?: any;
}

export class OutputFormatter {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Format output based on configuration
   */
  public formatOutput(output: FormattedOutput): string {
    const config = this.configManager.getConfig();
    
    switch (config.output.format) {
      case 'json':
        return this.formatJSON(output);
      case 'table':
        return this.formatTable(output);
      case 'csv':
        return this.formatCSV(output);
      default:
        return this.formatTable(output);
    }
  }

  /**
   * Format output as JSON
   */
  public formatJSON(output: FormattedOutput): string {
    const config = this.configManager.getConfig();
    const indent = config.output.verbose ? 2 : 0;
    
    return JSON.stringify(output, null, indent);
  }

  /**
   * Format output as table
   */
  public formatTable(output: FormattedOutput): string {
    const config = this.configManager.getConfig();
    let result = '';

    if (output.success) {
      result += config.output.colors ? chalk.green('✅ Success') : '✅ Success';
      
      if (output.message) {
        result += '\n' + (config.output.colors ? chalk.blue(output.message) : output.message);
      }

      if (output.data) {
        result += '\n' + this.formatDataAsTable(output.data);
      }
    } else {
      result += config.output.colors ? chalk.red('❌ Failed') : '❌ Failed';
      
      if (output.error?.message) {
        result += '\n' + (config.output.colors ? chalk.red('Error: ') : 'Error: ') + output.error.message;
      }
      
      if (output.error?.suggestion) {
        result += '\n' + (config.output.colors ? chalk.yellow('💡 Suggestion: ') : '💡 Suggestion: ') + output.error.suggestion;
      }
    }

    return result;
  }

  /**
   * Format output as CSV
   */
  public formatCSV(output: FormattedOutput): string {
    if (output.data && Array.isArray(output.data)) {
      return this.formatArrayAsCSV(output.data);
    } else if (output.data && typeof output.data === 'object') {
      return this.formatObjectAsCSV(output.data);
    } else {
      // Simple status CSV
      return `success,message,error\n${output.success},"${output.message || ''}","${output.error?.message || ''}"`;
    }
  }

  /**
   * Format data as table
   */
  private formatDataAsTable(data: any): string {
    if (Array.isArray(data)) {
      return this.formatArrayAsTable(data);
    } else if (typeof data === 'object' && data !== null) {
      return this.formatObjectAsTable(data);
    } else {
      return String(data);
    }
  }

  /**
   * Format array as table
   */
  private formatArrayAsTable(data: any[]): string {
    if (data.length === 0) {
      return 'No data available';
    }

    const config = this.configManager.getConfig();
    
    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    if (allKeys.size === 0) {
      // Simple array of primitives
      const table = new Table({
        head: ['Index', 'Value'],
        style: { 
          head: config.output.colors ? ['cyan'] : [],
          border: config.output.colors ? ['grey'] : []
        }
      });

      data.forEach((item, index) => {
        table.push([index, String(item)]);
      });

      return table.toString();
    } else {
      // Array of objects
      const headers = Array.from(allKeys);
      const table = new Table({
        head: headers,
        style: { 
          head: config.output.colors ? ['cyan'] : [],
          border: config.output.colors ? ['grey'] : []
        }
      });

      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          return value !== undefined ? String(value) : '';
        });
        table.push(row);
      });

      return table.toString();
    }
  }

  /**
   * Format object as table
   */
  private formatObjectAsTable(data: any): string {
    const config = this.configManager.getConfig();
    
    const table = new Table({
      head: ['Property', 'Value'],
      style: { 
        head: config.output.colors ? ['cyan'] : [],
        border: config.output.colors ? ['grey'] : []
      }
    });

    Object.entries(data).forEach(([key, value]) => {
      let formattedValue: string;
      
      if (typeof value === 'object' && value !== null) {
        formattedValue = JSON.stringify(value, null, 2);
      } else {
        formattedValue = String(value);
      }
      
      table.push([key, formattedValue]);
    });

    return table.toString();
  }

  /**
   * Format array as CSV
   */
  private formatArrayAsCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get all unique keys
    const allKeys = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    if (allKeys.size === 0) {
      // Simple array
      return data.map(item => `"${String(item)}"`).join('\n');
    } else {
      // Array of objects
      const headers = Array.from(allKeys);
      let csv = headers.join(',') + '\n';
      
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          if (value === undefined || value === null) {
            return '';
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += row.join(',') + '\n';
      });

      return csv;
    }
  }

  /**
   * Format object as CSV
   */
  private formatObjectAsCSV(data: any): string {
    const headers = ['property', 'value'];
    let csv = headers.join(',') + '\n';
    
    Object.entries(data).forEach(([key, value]) => {
      let formattedValue: string;
      
      if (typeof value === 'object' && value !== null) {
        formattedValue = JSON.stringify(value);
      } else {
        formattedValue = String(value);
      }
      
      csv += `"${key}","${formattedValue.replace(/"/g, '""')}"\n`;
    });

    return csv;
  }

  /**
   * Save output to file
   */
  public saveToFile(output: FormattedOutput, filename: string, format?: string): void {
    const actualFormat = format || this.configManager.getConfig().output.format;
    let content: string;

    switch (actualFormat) {
      case 'json':
        content = this.formatJSON(output);
        break;
      case 'csv':
        content = this.formatCSV(output);
        break;
      default:
        content = this.formatTable(output);
        break;
    }

    writeFileSync(filename, content, 'utf-8');
  }

  /**
   * Format transaction receipt
   */
  public formatTransactionReceipt(txResult: any): FormattedOutput {
    return {
      success: txResult.success,
      message: txResult.success ? 'Transaction completed successfully' : 'Transaction failed',
      data: {
        transactionId: txResult.txId,
        success: txResult.success,
        blockHeight: txResult.blockHeight,
        gasUsed: txResult.gasUsed,
        fee: txResult.fee,
        events: txResult.events || [],
        timestamp: new Date().toISOString()
      },
      error: txResult.error
    };
  }

  /**
   * Format batch operation results
   */
  public formatBatchResults(batchResult: any): FormattedOutput {
    const successRate = (batchResult.successful / batchResult.totalOperations * 100).toFixed(2);
    
    return {
      success: batchResult.successful > 0,
      message: `Batch operation completed: ${batchResult.successful}/${batchResult.totalOperations} successful (${successRate}%)`,
      data: {
        summary: {
          total: batchResult.totalOperations,
          successful: batchResult.successful,
          failed: batchResult.failed,
          skipped: batchResult.skipped,
          successRate: `${successRate}%`,
          executionTime: `${batchResult.executionTime}ms`
        },
        operations: batchResult.operations
      }
    };
  }

  /**
   * Format error output
   */
  public formatError(error: any): FormattedOutput {
    return {
      success: false,
      message: 'Operation failed',
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        category: error.category || 'system',
        suggestion: error.suggestion
      }
    };
  }

  /**
   * Display output to console
   */
  public displayOutput(output: FormattedOutput): void {
    const formatted = this.formatOutput(output);
    console.log(formatted);
  }
}