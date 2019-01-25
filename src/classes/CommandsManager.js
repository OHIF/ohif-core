import log from '../log.js';

function isFunction(subject) {
  return typeof subject === 'function';
}

export class CommandsManager {
  constructor() {
    this.contexts = {};
  }

  getContext(contextName) {
    const context = this.contexts[contextName];

    if (!context) {
      return log.warn(`No context found with name "${contextName}"`);
    }

    return context;
  }

  getCurrentContext() {
    const contextName = window.store.getState().commandContext.context;

    if (!contextName) {
      log.warn('There is no selected context');
      return null;
    }

    return this.getContext(contextName);
  }

  createContext(contextName) {
    if (!contextName) {
      return;
    }

    if (this.contexts[contextName]) {
      return this.clear(contextName);
    }

    this.contexts[contextName] = {};
  }

  set(contextName, definitions, extend = false) {
    if (typeof definitions !== 'object') {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    if (!extend) {
      this.clear(contextName);
    }

    Object.keys(definitions).forEach(
      command => (context[command] = definitions[command])
    );
  }

  register(contextName, command, definition) {
    if (typeof definition !== 'object') {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    context[command] = definition;
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
