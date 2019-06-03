import log from '../log.js';

/**
 * The definition of a command
 *
 * @typedef {Object} CommandDefinition
 * @property {Function} commandFn - Command to call
 * @property {Array} storeContexts - Array of string of modules required from store
 * @property {Object} options - Object of params to pass action
 */

/**
 * A more robust version of the CommandsManager lives in v1. If you're looking
 * to extend this class, please check it's source before adding new methods.
 */
export class CommandsManager {
  constructor() {
    this.contexts = {};
  }

  /**
   * Allows us to create commands "per context". An example would be the "Cornerstone"
   * context having a `SaveImage` command, and the "VTK" context having a `SaveImage`
   * command. The distinction of a context allows us to call the command in either
   * context, and have faith that the correct command will be run.
   *
   * @method
   * @param {string} contextName - Namespace for commands
   * @returns {undefined}
   */
  createContext(contextName) {
    if (!contextName) {
      return;
    }

    if (this.contexts[contextName]) {
      return this.clearContext(contextName);
    }

    this.contexts[contextName] = {};
  }

  /**
   * Returns all command definitions for a given context
   *
   * @method
   * @param {string} contextName - Namespace for commands
   * @returs {Object} - the matched context
   */
  getContext(contextName) {
    const context = this.contexts[contextName];

    if (!context) {
      return log.warn(`No context found with name "${contextName}"`);
    }

    return context;
  }

  /**
   * Clears all registered commands for a given context.
   *
   * @param {string} contextName - Namespace for commands
   * @returns {undefined}
   */
  clearContext(contextName) {
    if (!contextName) {
      return;
    }

    this.contexts[contextName] = {};
  }

  /**
   * Register a new command with the command manager. Scoped to a context, and
   * with a definition to assist command callers w/ providing the necessary params
   *
   * @method
   * @param {string} contextName - Namespace for command; often scoped to the extension that added it
   * @param {string} commandName - Unique name identifying the command
   * @param {CommandDefinition} definition - {@link CommandDefinition}
   */
  registerCommand(contextName, commandName, definition) {
    if (typeof definition !== 'object') {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    context[commandName] = definition;
  }

  /**
   *
   * @method
   * @param {String} commandName
   * @param {String} [contextName]
   */
  getCommand(commandName, contextName) {
    let contexts = [];

    if (contextName) {
      const context = this.getContext(contextName);
      if (context) {
        contexts.push(context);
      }
    } else {
      this.activeContexts.forEach(activeContext => {
        const context = this.getContext(activeContext);
        if (context) {
          contexts.push(context);
        }
      });
    }

    if (contexts.length === 0) {
      return;
    }

    let foundCommand;
    contexts.forEach(context => {
      if (context[commandName]) {
        foundCommand = context[commandName];
      }
    });

    return foundCommand;
  }

  /**
   *
   * @method
   * @param {String} commandName
   * @param {Object} [options] - Extra options to pass the command. Like a mousedown event
   * @param {String} [contextName]
   */
  runCommand(commandName, options, contextName) {
    const definition = this.getCommand(commandName, contextName);
    if (!definition) {
      return log.warn(`Command "${commandName}" not found in current context`);
    }

    const { action, params } = definition;

    if (typeof subject !== 'function') {
      log.warn(`No action was defined for command "${commandName}"`);
      return;
    } else {
      return action(params);
    }
  }
}

export default CommandsManager;
