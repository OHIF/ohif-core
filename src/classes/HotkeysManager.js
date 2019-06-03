import hotkeys from './hotkeys';
import log from './../log.js';

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 */

export class HotkeysManager {
  constructor(commandsManager) {
    this.hotkeyDefinitions = {};
    this.hotkeyDefaults = {};
    this.isEnabled = true;

    if (!commandsManager) {
      log.warn(
        'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
      );
    }

    this._commandsManager = commandsManager;
  }

  /**
   * Disables all hotkeys. Hotkeys added while disabled will not listen for
   * input.
   */
  disable() {
    if (this.isEnabled) {
      this.isEnabled.set(false);
      hotkeys.pause();
    }
  }

  /**
   * Enables all hotkeys.
   */
  enable() {
    if (!this.isEnabled) {
      this.isEnabled.set(true);
      hotkeys.unpause();
    }
  }

  // TODO: Just... Get Hotkeys?
  // Or.. GetHotkeysForExtension?
  getContext(contextName) {
    return this.contexts[contextName];
  }

  /**
   *
   * @param {HotkeyDefinition[]} hotkeyDefinitions
   * @param {Boolean} [isDefaultDefinitions]
   */
  set(hotkeyDefinitions, isDefaultDefinitions = false) {
    hotkeyDefinitions.forEach(definition => {
      const { commandName, keys } = definition;
      this.registerHotkeys(commandName, keys);
    });

    if (isDefaultDefinitions) {
      this.defaultsHotkeys = hotkeyDefinitions;
    }
  }

  /**
   * Removes hotkey bindings, context, and defaults for the provided contextName
   *
   * @method
   * @param {String} contextName
   * @returns {undefined}
   */
  // unsetContext(contextName) {
  //   delete this.contexts[contextName];
  //   delete this.defaults[contextName];
  // }

  /**
   *
   * @param {string} commandName
   * @param {String[]} keys
   * @returns {undefined}
   */
  registerHotkeys(commandName, keys, extension) {
    if (!commandName) {
      log.warn(`No command was defined for hotkey "${keys}"`);
      return;
    }

    const hotkeyExists = this.hotkeyDefinitions[commandName] !== undefined;
    if (hotkeyExists) {
      this._unbindHotkeys(commandName, keys);
    }

    // Set definition & bind
    this.hotkeyDefinitions[commandName] = keys;
    this._bindHotkeys(commandName, keys);
  }

  unregister(command) {
    const bindingKey = `keydown.hotkey.${this.name}.${command}`;
    if (this.definitions[command]) {
      $(document).unbind(bindingKey);
      delete this.definitions[command];
    }
  }

  /**
   *
   */
  restoreDefaults() {
    // TODO
  }

  /**
   *
   */
  destroy() {
    this.hotkeyDefaults = {};
    this.hotkeyDefinitions = {};
    hotkeys.reset();
  }

  /**
   * Binds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the command to trigger when hotkeys are used
   * @param {string[]} keys - One or more key combinations that should trigger command
   * @returns {undefined}
   */
  _bindHotkeys(commandName, keys) {
    const isKeyDefined = keys === '' || keys === undefined;
    if (isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      keys.forEach(key => this._bindHotkeys(commandName, key));
      return;
    }

    hotkeys.bind(keys, evt => {
      this._commandsManager.runCommand(commandName, { evt });
    });
  }

  /**
   * unbinds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the previously bound command
   * @param {string[]} keys - One or more sets of previously bound keys
   * @returns {undefined}
   */
  _unbindHotkeys(commandName, keys) {
    const isKeyDefined = keys === '' || keys === undefined;
    if (!isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      keys.forEach(key => this._unbindHotkeys(commandName, key));
      return;
    }

    hotkeys.unbind(keys);
  }
}

export default HotkeysManager;

// Commands Contexts:

// --> Name and Priority
// GLOBAL: 0
// VIEWER::CORNERSTONE: 1
// VIEWER::VTK: 1
