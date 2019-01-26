import HotkeysContext from './HotkeysContext';

export class HotkeysManager {
  constructor() {
    this.contexts = {};
    this.defaults = {};
    this.currentContextName = null;
    this.enabled = true;
    this.storeFunction = null;
  }

  disable() {
    this.enabled.set(false);
  }

  enable() {
    this.enabled.set(true);
  }

  getContext(contextName) {
    return this.contexts[contextName];
  }

  getCurrentContext() {
    return this.getContext(this.currentContextName);
  }

  set(contextName, contextDefinitions, isDefaultDefinitions = false) {
    const enabled = this.enabled;
    const context = new HotkeysContext(
      contextName,
      contextDefinitions,
      enabled
    );

    const currentContext = this.getCurrentContext() || context;

    currentContext.destroy();

    context.initialize();

    this.contexts[contextName] = context;
    if (isDefaultDefinitions) {
      this.defaults[contextName] = contextDefinitions;
    }

    this.currentContextName = contextName;
  }

  unsetContext(contextName) {
    if (contextName === this.currentContextName) {
      this.getCurrentContext().destroy();
    }

    delete this.contexts[contextName];
    delete this.defaults[contextName];
  }
}

export default HotkeysManager;
