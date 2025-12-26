/**
 * Command Router
 * Routes commands to appropriate handler modules
 */

import { CommandDefinition, CommandHandler } from '../config/types.js';

export class CommandRouter {
  private commands: Map<string, CommandDefinition> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Register a command with the router
   */
  public registerCommand(command: CommandDefinition): void {
    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name);
      });
    }
  }

  /**
   * Get command by name or alias
   */
  public getCommand(name: string): CommandDefinition | undefined {
    // Check if it's an alias first
    const actualName = this.aliases.get(name) || name;
    return this.commands.get(actualName);
  }

  /**
   * Get all registered commands
   */
  public getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute a command
   */
  public async executeCommand(commandName: string, args: any): Promise<any> {
    const command = this.getCommand(commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Validate required parameters
    this.validateParameters(command, args);

    // Execute the command
    return await command.handler(args);
  }

  /**
   * Validate command parameters
   */
  private validateParameters(command: CommandDefinition, args: any): void {
    for (const param of command.parameters) {
      if (param.required && (args[param.name] === undefined || args[param.name] === null)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      if (args[param.name] !== undefined) {
        this.validateParameterType(param, args[param.name]);
        this.validateParameterRules(param, args[param.name]);
      }
    }
  }

  /**
   * Validate parameter type
   */
  private validateParameterType(param: any, value: any): void {
    switch (param.type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          throw new Error(`Parameter ${param.name} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new Error(`Parameter ${param.name} must be a boolean`);
        }
        break;
      case 'address':
        if (typeof value !== 'string' || !this.isValidStacksAddress(value)) {
          throw new Error(`Parameter ${param.name} must be a valid Stacks address`);
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string`);
        }
        break;
    }
  }

  /**
   * Validate parameter rules
   */
  private validateParameterRules(param: any, value: any): void {
    if (!param.validation) return;

    for (const rule of param.validation) {
      switch (rule.type) {
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            throw new Error(rule.message);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            throw new Error(rule.message);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            throw new Error(rule.message);
          }
          break;
      }
    }
  }

  /**
   * Check if address is valid Stacks address
   */
  private isValidStacksAddress(address: string): boolean {
    const stacksAddressRegex = /^S[0-9A-Z]{39}$/;
    return stacksAddressRegex.test(address);
  }

  /**
   * Get command suggestions for unknown commands
   */
  public getCommandSuggestions(input: string): string[] {
    const allNames = [
      ...Array.from(this.commands.keys()),
      ...Array.from(this.aliases.keys())
    ];

    return allNames
      .filter(name => name.includes(input.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Generate help text for a command
   */
  public getCommandHelp(commandName: string): string {
    const command = this.getCommand(commandName);
    
    if (!command) {
      return `Unknown command: ${commandName}`;
    }

    let help = `\n📖 ${command.name} - ${command.description}\n\n`;
    
    if (command.aliases && command.aliases.length > 0) {
      help += `Aliases: ${command.aliases.join(', ')}\n\n`;
    }

    if (command.parameters.length > 0) {
      help += 'Parameters:\n';
      command.parameters.forEach(param => {
        const required = param.required ? '(required)' : '(optional)';
        help += `  --${param.name} ${required} - ${param.description}\n`;
      });
      help += '\n';
    }

    if (command.examples.length > 0) {
      help += 'Examples:\n';
      command.examples.forEach(example => {
        help += `  ${example}\n`;
      });
    }

    return help;
  }

  /**
   * Generate general help text
   */
  public getGeneralHelp(): string {
    let help = '\n🚀 Bitdap Token Interaction Script\n\n';
    help += 'Available Commands:\n';
    
    this.getAllCommands().forEach(command => {
      help += `  ${command.name.padEnd(15)} - ${command.description}\n`;
    });
    
    help += '\nUse --help with any command for detailed information.\n';
    help += 'Example: npm run token-interact mint --help\n';
    
    return help;
  }
}