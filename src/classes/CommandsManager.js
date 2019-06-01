import log from '../log.js';

function isFunction(subject) {
  return typeof subject === 'function';
}

/**
 *
 */
export class CommandsManager {
  constructor() {
    this.contexts = {};
  }

  /**
   * Returns all command definitions for a given context
   *
   * @param {string} contextName - Namespace for commands
   */
  getContext(contextName) {
    const context = this.contexts[contextName];

    if (!context) {
      return log.warn(`No context found with name "${contextName}"`);
    }

    return context;
  }

  /**
   * Allows us to create commands "per context". An example would be the "Cornerstone"
   * context having a `SaveImage` command, and the "VTK" context having a `SaveImage`
   * command. The distinction of a context allows us to call the command in either
   * context, and have faith that the correct command will be run.
   *
   * @param {string} contextName - Namespace for commands
   */
  createContext(contextName) {
    if (!contextName) {
      return;
    }

    if (this.contexts[contextName]) {
      return this.clear(contextName);
    }

    this.contexts[contextName] = {};
  }

  /**
   * Register a new command with the command manager. Scoped to a context, and
   * with a definition to assist command callers w/ providing the necessary params
   *
   * @param {string} contextName - Namespace for command; often scoped to the extension that added it
   * @param {string} commandName - Unique name identifying the command
   * @param {Object} definition -
   * @param {Function} definition.commandFn - Command to call
   * @param {Array} definition.storeContexts - Array of string of modules required from store
   * @param {Object} definition.options - Object of params to pass action
   */
  register(contextName, commandName, definition) {
    if (typeof definition !== 'object') {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    context[commandName] = definition;
  }

  setDisabledFunction(contextName, command, func) {
    if (!command || !isFunction(func)) {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    const definition = context[command];
    if (!definition) {
      log.warn(
        `Trying to set a disabled function to a command "${command}" that was not yet defined`
      );
      return;
    }

    definition.disabled = func;
  }

  clear(contextName) {
    if (!contextName) {
      return;
    }

    this.contexts[contextName] = {};
  }

  getDefinition(command) {
    const context = this.getCurrentContext();

    if (!context) {
      return;
    }

    return context[command];
  }

  isDisabled(command) {
    const definition = this.getDefinition(command);

    if (!definition) {
      return false;
    }

    const { disabled } = definition;

    if (isFunction(disabled) && disabled()) {
      return true;
    }

    if (!isFunction(disabled) && disabled) {
      return true;
    }

    return false;
  }

  run(command) {
    const definition = this.getDefinition(command);
    if (!definition) {
      return log.warn(`Command "${command}" not found in current context`);
    }

    if (this.isDisabled(command)) {
      return;
    }

    const { action, params } = definition;

    if (!isFunction(action)) {
      log.warn(`No action was defined for command "${command}"`);
      return;
    } else {
      return action(params);
    }
  }
}

export default CommandsManager;
