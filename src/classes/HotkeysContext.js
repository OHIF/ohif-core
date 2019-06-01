import CommandsManager from '../CommandsManager.js';
import Mousetrap from 'mousetrap';
import log from '../log.js';

export class HotkeysContext {
  constructor(store, name, definitions, enabled) {
    this.store = store;
    this.name = name;
    this.definitions = Object.assign({}, definitions);
    this.enabled = enabled;
  }

  register(hotkeysName) {
    const hotkeysDefinition = this.definitions[hotkeysName];
    const commandDefinition = _findCommandDefinition(this.name, commandName);

    if (keys instanceof Array) {
      // TODO: register each instance
      return;
    }

    if (!keys) {
      return;
    }

    if (!commandDefinition) {
      return log.warn(`No command was defined for hotkey "${keys}"`);
    }

    const { commandFn, storeContexts, options } = commandDefinition;

    Mousetrap.bind(keys, () => {
      let commandParams = options;
      storeContexts.forEach(context => {
        commandParams[context] = this.store.getState()[context];
      });
      commandFn(commandParams);
    });
  }

  unregister(command) {
    const bindingKey = `keydown.hotkey.${this.name}.${command}`;
    if (this.definitions[command]) {
      $(document).unbind(bindingKey);
      delete this.definitions[command];
    }
  }

  initialize() {
    Object.keys(this.definitions).forEach(command => {
      const hotkey = this.definitions[command];
      this.register(command, hotkey);
    });
  }

  destroy() {
    // TODO:
    // $(document).unbind(`keydown.hotkey.${this.name}`);
  }
}

// * @param {Function} definition.commandFn - Command to call
// * @param {Array} definition.storeContexts - Array of string of modules required from store
// * @param {Object} definition.options - Object of params to pass action
function _findCommandDefinition(contextName, commandName) {
  const commandContext = CommandsManager.getContext(contextName);
  const command = commandContext[commandName];

  return command;
}

export default HotkeysContext;
