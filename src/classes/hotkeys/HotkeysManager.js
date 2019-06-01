import Mousetrap from './Mousetrap.js';
import HotkeysContext from './HotkeysContext';

// Hotkeysmanager has hotkeys..
// Hotkeys have...
// - context
// - default keys
// - keys
// - command (by name)

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 */

// Hotkeys are really... Commands that CAN be bound to one or more keys
// So we can use the same identifier we use for commands?

export class HotkeysManager {
  constructor() {
    this.contexts = {};
    this.defaults = {};
    this.currentContextName = null;
    this.enabled = true;
    this.storeFunction = null;
  }

  /**
   * Disables all hotkeys. Hotkeys added while disabled will not listen for
   * input.
   */
  disable() {
    this.enabled.set(false);
    Mousetrap.pause();
  }

  /**
   * Enables all hotkeys.
   */
  enable() {
    this.enabled.set(true);
    Mousetrap.unpause();
  }

  getContext(contextName) {
    return this.contexts[contextName];
  }

  getCurrentContext() {
    return this.getContext(this.currentContextName);
  }

  /**
   * Sets all hotkeys for a given context. If the context does not exist,
   * it is created.
   *
   * @param {String} contextName
   * @param {HotkeyDefinition[]} hotkeyDefinitions
   * @param {Boolean} [isDefaultDefinitions]
   */
  set(contextName, hotkeyDefinitions, isDefaultDefinitions = false) {
    const enabled = this.enabled;
    const context = new HotkeysContext(contextName, hotkeyDefinitions, enabled);

    // const currentContext = this.getCurrentContext() || context;
    // currentContext.destroy();

    context.initialize();

    this.contexts[contextName] = context;
    if (isDefaultDefinitions) {
      this.defaults[contextName] = hotkeyDefinitions;
    }

    // this.currentContextName = contextName;
  }

  /**
   * Removes hotkey bindings, context, and defaults for the provided contextName
   *
   * @method
   * @param {String} contextName
   * @returns {undefined}
   */
  unsetContext(contextName) {
    if (contextName === this.currentContextName) {
      this.getCurrentContext().destroy();
    }

    delete this.contexts[contextName];
    delete this.defaults[contextName];
  }
}

export default HotkeysManager;
